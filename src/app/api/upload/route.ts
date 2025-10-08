import Busboy from "busboy";
import { randomUUID } from "crypto";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import fsPromises from "fs/promises";
import { NextResponse } from "next/server";
import { tmpdir } from "os";
import path from "path";
export const config = {
  api: {
    bodyParser: false,
  },
};

type ParsedForm = {
  fields: Record<string, string>;
  filePath: string;
};

export function parseMultipartForm(req: Request): Promise<ParsedForm> {
  return new Promise((resolve, reject) => {
    const contentType = req.headers.get("content-type");
    if (!contentType) return reject(new Error("Missing content-type"));

    const busboy = Busboy({ headers: { "content-type": contentType } });

    const fields: Record<string, string> = {};
    const fileWritePromises: Promise<void>[] = [];
    let savedFilePath = "";

    busboy.on("file", (_name, file, info) => {
      const { filename } = info;
      const ext = path.extname(filename) || "";
      const tmpFilePath = path.join(tmpdir(), `${randomUUID()}${ext}`);
      savedFilePath = tmpFilePath;

      const fileStream = fs.createWriteStream(tmpFilePath);
      file.pipe(fileStream);

      const fileWritePromise = new Promise<void>((res, rej) => {
        fileStream.on("finish", res);
        fileStream.on("error", rej);
        file.on("error", rej);
      });

      fileWritePromises.push(fileWritePromise);
    });

    busboy.on("field", (name, val) => {
      fields[name] = val;
    });

    busboy.on("finish", () => {
      Promise.all(fileWritePromises)
        .then(() => {
          if (!savedFilePath) {
            reject(new Error("No file uploaded"));
            return;
          }
          resolve({ fields, filePath: savedFilePath });
        })
        .catch(reject);
    });

    busboy.on("error", reject);

    const reader = req.body!.getReader();

    function pump(): Promise<void> {
      return reader.read().then(({ done, value }) => {
        if (done) {
          busboy.end();
          return;
        }
        busboy.write(value);
        return pump();
      });
    }

    pump().catch(reject);
  });
}

export function parseMultipartFormVideo(req: Request): Promise<ParsedForm> {
  return new Promise((resolve, reject) => {
    const contentType = req.headers.get("content-type");
    if (!contentType) return reject(new Error("Missing content-type"));

    const busboy = Busboy({ headers: { "content-type": contentType } });
    const tmpFilePath = path.join(tmpdir(), `${randomUUID()}.mp4`);
    const fileStream = fs.createWriteStream(tmpFilePath);

    const fields: Record<string, string> = {};
    let fileSaved = false;

    busboy.on("file", (_name, file, _info) => {
      file.pipe(fileStream);
      file.on("end", () => {
        fileSaved = true;
      });
    });

    busboy.on("field", (name, val) => {
      fields[name] = val;
    });

    busboy.on("finish", () => {
      if (!fileSaved) return reject(new Error("No file uploaded"));
      resolve({ fields, filePath: tmpFilePath });
    });

    busboy.on("error", reject);

    const reader = req.body!.getReader();

    function pump(): Promise<void> {
      return reader.read().then(({ done, value }) => {
        if (done) {
          busboy.end();
          return;
        }
        busboy.write(value);
        return pump();
      });
    }

    pump().catch(reject);
  });
}

export async function POST(req: Request) {
  try {
    const ffmpegPath = process.env.FFMPEG_PATH;
    if (!ffmpegPath) {
      return NextResponse.json(
        { error: "FFMPEG_PATH not defined" },
        { status: 500 }
      );
    }

    ffmpeg.setFfmpegPath(ffmpegPath);
    const { fields, filePath } = await parseMultipartFormVideo(req);

    const cropX = parseFloat(fields.cropX);
    const cropY = parseFloat(fields.cropY);
    const cropWidth = parseFloat(fields.cropWidth);
    const cropHeight = parseFloat(fields.cropHeight);
    const startTime = parseFloat(fields.startTime);
    const endTime = parseFloat(fields.endTime);
    const duration = endTime - startTime;
    const outputPath = path.join(tmpdir(), `trimmed-${Date.now()}.mp4`);

    await new Promise<void>((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ffmpeg(filePath) as any)
        .setStartTime(startTime)
        .setDuration(duration)
        .videoFilter(`crop=${cropWidth}:${cropHeight}:${cropX}:${cropY}`)
        .output(outputPath)
        .on("end", (_stdout: unknown, _stderr: unknown) => resolve())
        .on("error", reject)
        .run();
    });

    const fileBuffer = await fsPromises.readFile(outputPath);
    await fsPromises.unlink(filePath);
    await fsPromises.unlink(outputPath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": 'attachment; filename="trimmed.mp4"',
      },
    });
  } catch (err) {
    console.error("Trimming error:", err);
    return NextResponse.json(
      { error: "Failed to trim video" },
      { status: 500 }
    );
  }
}
