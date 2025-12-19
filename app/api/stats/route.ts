import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getMonthDetails(year: number, month: number) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let expectedHours = 0;
  let totalWorkingDays = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay(); 
    if (dayOfWeek === 0) continue; // Sunday
    if (dayOfWeek === 6) { expectedHours += 4; totalWorkingDays++; }
    else { expectedHours += 8.5; totalWorkingDays++; }
  }
  return { expectedHours, totalWorkingDays };
}

export async function GET() {
  try {
    const records = await prisma.attendance.findMany({
      include: { employee: true },
      orderBy: { date: 'desc' } // Newest first for the "Daily Breakdown"
    });

    if (records.length === 0) return NextResponse.json({ summary: [], daily: [] });

    // 1. Month Details
    const firstRecordDate = new Date(records[0].date);
    const year = firstRecordDate.getFullYear();
    const month = firstRecordDate.getMonth();
    const { expectedHours, totalWorkingDays } = getMonthDetails(year, month);

    // 2. Group by Employee
    const stats: any = {};
    records.forEach((record) => {
      const name = record.employee.name;
      if (!stats[name]) {
        stats[name] = { name: name, actualHours: 0, daysPresent: 0 };
      }
      if (record.workedHours > 0) {
        stats[name].actualHours += record.workedHours;
        stats[name].daysPresent += 1;
      }
    });

    // 3. Process Summary
    const summary = Object.values(stats).map((emp: any) => {
      let leavesTaken = totalWorkingDays - emp.daysPresent;
      if (leavesTaken < 0) leavesTaken = 0;

      let productivity = 0;
      if (expectedHours > 0) {
        productivity = (emp.actualHours / expectedHours) * 100;
      }

      return {
        name: emp.name,
        totalExpectedHours: expectedHours.toFixed(1),
        totalActualHours: emp.actualHours.toFixed(1),
        leavesTaken,
        productivity: parseFloat(productivity.toFixed(1)), // Number for the Graph
        productivityDisplay: productivity.toFixed(1) + "%" // String for the Table
      };
    });

    // 4. Process Daily Breakdown (Format Dates)
    const daily = records.map(r => ({
      id: r.id,
      date: new Date(r.date).toLocaleDateString(),
      employee: r.employee.name,
      inTime: r.inTime || "-",
      outTime: r.outTime || "-",
      workedHours: r.workedHours,
      status: r.workedHours > 0 ? "Present" : "Absent/Leave"
    }));

    return NextResponse.json({ summary, daily });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}