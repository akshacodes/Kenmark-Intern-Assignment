import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

function calculateWorkedHours(inTime: any, outTime: any) {
  if (inTime == null || outTime == null) return 0;

  // Case 1: Excel sent Numbers (fraction of a day)
  if (typeof inTime === "number" && typeof outTime === "number") {
    let diff = (outTime - inTime) * 24;
    if (diff < 0) diff += 24;
    return parseFloat(diff.toFixed(2));
  }

  // Case 2: Excel sent Strings (e.g., "10:00")
  if (typeof inTime === "string" && typeof outTime === "string") {
    const [inH, inM] = inTime.split(":").map(Number);
    const [outH, outM] = outTime.split(":").map(Number);
    
    if (isNaN(inH) || isNaN(outH)) return 0;

    const dateIn = new Date(0, 0, 0, inH, inM);
    const dateOut = new Date(0, 0, 0, outH, outM);
    let diff = (dateOut.getTime() - dateIn.getTime()) / (1000 * 60 * 60);

    if (diff < 0) diff += 24;
    return parseFloat(diff.toFixed(2));
  }

  return 0;
}

function excelDateToJSDate(serial: number) {
   const utc_days  = Math.floor(serial - 25569);
   const utc_value = utc_days * 86400;                                        
   const date_info = new Date(utc_value * 1000);
   return date_info;
}

export async function POST(req: NextRequest) {
  console.log("DEBUG DATABASE_URL:", JSON.stringify(process.env.DATABASE_URL));
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    const jsonData = XLSX.utils.sheet_to_json(sheet);

    for (const row of jsonData as any[]) {
      const name = row["Employee Name"];
      const rawDate = row["Date"];
      const inTime = row["In-Time"];
      const outTime = row["Out-Time"];

      if (!name || !rawDate) continue;

      let dateObj;
      if (typeof rawDate === 'number') {
        dateObj = excelDateToJSDate(rawDate);
      } else {
        dateObj = new Date(rawDate);
      }

      const workedHours = calculateWorkedHours(inTime, outTime);

      const employee = await prisma.employee.upsert({
        where: { name: name },
        update: {},
        create: { name: name },
      });

      await prisma.attendance.upsert({
        where: {
          employeeId_date: {
            employeeId: employee.id,
            date: dateObj,
          },
        },
        update: {
          inTime: String(inTime || ""),
          outTime: String(outTime || ""),
          workedHours: workedHours,
        },
        create: {
          employeeId: employee.id,
          date: dateObj,
          inTime: String(inTime || ""),
          outTime: String(outTime || ""),
          workedHours: workedHours,
        },
      });
    }

    return NextResponse.json({ message: "Upload successful" });
  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "Failed to process file" }, { status: 500 });
  }
}