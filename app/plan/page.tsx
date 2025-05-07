"use client";

import { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  getDay,
  parseISO,
  isSameMonth,
  isSameDay,
  addHours,
} from "date-fns";
import { th } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  CalendarDays,
  Menu,
  X,
  Edit3,
  Trash2,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Shift {
  id: string;
  date: string; // ISO string
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  rate: number;
  notes?: string;
}

export default function PlannerPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAddingShift, setIsAddingShift] = useState(false);
  const [isEditingShift, setIsEditingShift] = useState<string | null>(null);
  const [hourlyRate, setHourlyRate] = useState(300); // Default hourly rate (บาท)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isToolbarOpen, setIsToolbarOpen] = useState(false);

  const [newShift, setNewShift] = useState({
    date: "",
    startTime: "09:00",
    endTime: "18:00",
    rate: hourlyRate,
    notes: "",
  });

  // ตรวจสอบว่าเป็นอุปกรณ์มือถือหรือไม่
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  // โหลดข้อมูลเวรจาก localStorage
  useEffect(() => {
    const savedShifts = localStorage.getItem("planner-shifts");
    const savedRate = localStorage.getItem("planner-hourly-rate");

    if (savedShifts) {
      setShifts(JSON.parse(savedShifts));
    }

    if (savedRate) {
      setHourlyRate(parseInt(savedRate));
    }
  }, []);

  // บันทึกข้อมูลเวรลง localStorage เมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    localStorage.setItem("planner-shifts", JSON.stringify(shifts));
  }, [shifts]);

  // บันทึกค่าจ้างต่อชั่วโมงลง localStorage เมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    localStorage.setItem("planner-hourly-rate", hourlyRate.toString());
  }, [hourlyRate]);

  // คำนวณวันในเดือนปัจจุบัน
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // คำนวณวันแรกของเดือนว่าเริ่มที่วันไหนในสัปดาห์ (0 = อาทิตย์, 1 = จันทร์, ...)
  const startDay = getDay(monthStart);

  // เปลี่ยนไปเดือนก่อนหน้า
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  // เปลี่ยนไปเดือนถัดไป
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // เปลี่ยนไปเดือนปัจจุบัน
  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  // คำนวณจำนวนชั่วโมงระหว่างเวลาเริ่มต้นและสิ้นสุด
  const calculateHours = (startTime: string, endTime: string) => {
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    const startDate = new Date();
    startDate.setHours(startHour, startMinute, 0);

    const endDate = new Date();
    endDate.setHours(endHour, endMinute, 0);

    // ถ้าเวลาสิ้นสุดน้อยกว่าเวลาเริ่มต้น ให้เพิ่ม 24 ชั่วโมง (ข้ามวัน)
    if (endDate < startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }

    const diffHours =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    return Math.round(diffHours * 100) / 100; // ปัดเศษทศนิยม 2 ตำแหน่ง
  };

  // คำนวณรายได้ทั้งหมดในเดือนปัจจุบัน
  const calculateMonthlyIncome = () => {
    const currentMonthShifts = shifts.filter((shift) => {
      const shiftDate = parseISO(shift.date);
      return isSameMonth(shiftDate, currentMonth);
    });

    const totalIncome = currentMonthShifts.reduce((sum, shift) => {
      const hours = calculateHours(shift.startTime, shift.endTime);
      return sum + hours * shift.rate;
    }, 0);

    return totalIncome;
  };

  // คำนวณจำนวนชั่วโมงทั้งหมดในเดือนปัจจุบัน
  const calculateMonthlyHours = () => {
    const currentMonthShifts = shifts.filter((shift) => {
      const shiftDate = parseISO(shift.date);
      return isSameMonth(shiftDate, currentMonth);
    });

    const totalHours = currentMonthShifts.reduce((sum, shift) => {
      return sum + calculateHours(shift.startTime, shift.endTime);
    }, 0);

    return totalHours;
  };

  // เพิ่มเวรใหม่
  const addShift = () => {
    if (selectedDate) {
      const newShiftData: Shift = {
        id: Math.random().toString(36).substring(2),
        date: selectedDate.toISOString(),
        startTime: newShift.startTime,
        endTime: newShift.endTime,
        rate: newShift.rate || hourlyRate,
        notes: newShift.notes,
      };

      setShifts([...shifts, newShiftData]);
      setIsAddingShift(false);
      setNewShift({
        date: "",
        startTime: "09:00",
        endTime: "18:00",
        rate: hourlyRate,
        notes: "",
      });
    }
  };

  // แก้ไขเวร
  const editShift = (shiftId: string) => {
    const shiftToEdit = shifts.find((s) => s.id === shiftId);
    if (shiftToEdit) {
      setNewShift({
        date: shiftToEdit.date,
        startTime: shiftToEdit.startTime,
        endTime: shiftToEdit.endTime,
        rate: shiftToEdit.rate,
        notes: shiftToEdit.notes || "",
      });
      setIsEditingShift(shiftId);
      setIsAddingShift(true);
    }
  };

  // บันทึกการแก้ไขเวร
  const saveEditedShift = () => {
    if (isEditingShift) {
      const updatedShifts = shifts.map((shift) => {
        if (shift.id === isEditingShift) {
          return {
            ...shift,
            startTime: newShift.startTime,
            endTime: newShift.endTime,
            rate: newShift.rate,
            notes: newShift.notes,
          };
        }
        return shift;
      });

      setShifts(updatedShifts);
      setIsEditingShift(null);
      setIsAddingShift(false);
      setNewShift({
        date: "",
        startTime: "09:00",
        endTime: "18:00",
        rate: hourlyRate,
        notes: "",
      });
    }
  };

  // ลบเวร
  const deleteShift = (shiftId: string) => {
    const updatedShifts = shifts.filter((shift) => shift.id !== shiftId);
    setShifts(updatedShifts);
  };

  // ดึงเวรในวันที่เลือก
  const getShiftsForDate = (date: Date) => {
    return shifts.filter((shift) => {
      const shiftDate = parseISO(shift.date);
      return isSameDay(shiftDate, date);
    });
  };

  // ตรวจสอบว่าวันที่มีเวรหรือไม่
  const hasShifts = (date: Date) => {
    return getShiftsForDate(date).length > 0;
  };

  // จัดรูปแบบเวลาให้อ่านง่าย
  const formatTime = (time: string) => {
    return time;
  };

  // สร้างปุ่มเดือน
  const monthlyIncomeFormatted = new Intl.NumberFormat("th-TH").format(
    Math.round(calculateMonthlyIncome())
  );
  const monthlyHours = calculateMonthlyHours().toFixed(1);

  return (
    <div className="flex flex-col h-[100vh] h-[calc(var(--vh,1vh)*100)]">
      {/* Mobile Header */}
      <header className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white flex justify-between items-center sticky top-0 z-10 shadow-md ios-safe-area-top">
        <div>
          <h1 className="text-xl font-bold">Planner</h1>
          <p className="text-xs opacity-80">จัดการเวลาทำงานและคำนวณรายได้</p>
        </div>
        <div className="flex gap-2">
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsToolbarOpen(!isToolbarOpen)}
              className="text-white"
            >
              {isToolbarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          )}
        </div>
      </header>

      {/* Toolbar - แสดงบน desktop หรือเมื่อเปิดบน mobile */}
      <div
        className={cn(
          "bg-white shadow-md p-4 transition-all",
          isMobile ? (isToolbarOpen ? "block" : "hidden") : "block"
        )}
      >
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <Button onClick={prevMonth} variant="outline" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-medium w-32 text-center">
              {format(currentMonth, "MMMM yyyy", { locale: th })}
            </h2>
            <Button onClick={nextMonth} variant="outline" size="icon">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              onClick={goToToday}
              variant="secondary"
              size="sm"
              className="ml-2"
            >
              วันนี้
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-2 flex gap-2 items-center">
                <Clock className="text-blue-500 h-4 w-4" />
                <div>
                  <div className="text-xs text-blue-700">ชั่วโมงทั้งหมด</div>
                  <div className="font-medium">{monthlyHours} ชม.</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-2 flex gap-2 items-center">
                <DollarSign className="text-green-500 h-4 w-4" />
                <div>
                  <div className="text-xs text-green-700">รายได้ประมาณการ</div>
                  <div className="font-medium">
                    {monthlyIncomeFormatted} บาท
                  </div>
                </div>
              </CardContent>
            </Card>

            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  ตั้งค่า
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>ตั้งค่า</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate">
                      อัตราค่าจ้างต่อชั่วโมง (บาท)
                    </Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      value={hourlyRate}
                      onChange={(e) =>
                        setHourlyRate(parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button>บันทึก</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto p-1 md:p-4">
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {/* Header */}
          {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((day, index) => (
            <div
              key={index}
              className="bg-gray-100 text-center py-2 font-medium text-gray-600"
            >
              {day}
            </div>
          ))}

          {/* Empty cells for days before start of month */}
          {Array.from({ length: startDay }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="bg-white p-1 h-20 md:h-28 min-h-[5rem]"
            ></div>
          ))}

          {/* Days of month */}
          {daysInMonth.map((day, index) => {
            const dayShifts = getShiftsForDate(day);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDate && isSameDay(day, selectedDate);

            return (
              <div
                key={index}
                className={cn(
                  "bg-white p-1 h-20 md:h-28 min-h-[5rem] flex flex-col transition-colors",
                  isToday ? "bg-blue-50" : "",
                  isSelected ? "ring-2 ring-blue-500" : "",
                  hasShifts(day) ? "bg-blue-50/50" : ""
                )}
                onClick={() => {
                  setSelectedDate(day);
                  if (isMobile) {
                    setIsAddingShift(true);
                  }
                }}
              >
                <div
                  className={cn(
                    "flex justify-center items-center w-6 h-6 rounded-full text-sm self-end mb-1",
                    isToday ? "bg-blue-500 text-white" : "text-gray-700"
                  )}
                >
                  {format(day, "d")}
                </div>

                <div className="overflow-y-auto flex-1 text-xs space-y-1">
                  {dayShifts.map((shift) => {
                    const hours = calculateHours(
                      shift.startTime,
                      shift.endTime
                    );
                    const income = hours * shift.rate;

                    return (
                      <div
                        key={shift.id}
                        className="bg-blue-100 p-1 rounded text-blue-800 flex items-center justify-between"
                        onClick={(e) => {
                          e.stopPropagation();
                          editShift(shift.id);
                        }}
                      >
                        <span>
                          {formatTime(shift.startTime)}-
                          {formatTime(shift.endTime)}
                        </span>
                        <span>
                          {new Intl.NumberFormat("th-TH").format(income)}฿
                        </span>
                      </div>
                    );
                  })}
                </div>

                {!isMobile && (
                  <div className="mt-auto">
                    {dayShifts.length === 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs h-6 text-gray-400 hover:text-blue-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(day);
                          setIsAddingShift(true);
                        }}
                      >
                        + เพิ่มเวร
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Detail / Add Shift Dialog */}
      <Dialog open={isAddingShift} onOpenChange={setIsAddingShift}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditingShift ? "แก้ไขเวร" : "เพิ่มเวร"}
              {selectedDate &&
                ` - ${format(selectedDate, "d MMMM yyyy", { locale: th })}`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">เวลาเริ่ม</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={newShift.startTime}
                  onChange={(e) =>
                    setNewShift({ ...newShift, startTime: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">เวลาสิ้นสุด</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={newShift.endTime}
                  onChange={(e) =>
                    setNewShift({ ...newShift, endTime: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate">อัตราค่าจ้างต่อชั่วโมง (บาท)</Label>
              <Input
                id="rate"
                type="number"
                value={newShift.rate}
                onChange={(e) =>
                  setNewShift({
                    ...newShift,
                    rate: parseInt(e.target.value) || hourlyRate,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">บันทึกเพิ่มเติม</Label>
              <Input
                id="notes"
                value={newShift.notes}
                onChange={(e) =>
                  setNewShift({ ...newShift, notes: e.target.value })
                }
                placeholder="บันทึกรายละเอียด (ถ้ามี)"
              />
            </div>

            {newShift.startTime && newShift.endTime && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-3">
                  <div className="flex justify-between text-sm">
                    <span>ชั่วโมงทำงาน:</span>
                    <span className="font-medium">
                      {calculateHours(newShift.startTime, newShift.endTime)}{" "}
                      ชั่วโมง
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>รายได้ประมาณการ:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("th-TH").format(
                        Math.round(
                          calculateHours(newShift.startTime, newShift.endTime) *
                            newShift.rate
                        )
                      )}{" "}
                      บาท
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center">
            {isEditingShift && (
              <Button
                variant="destructive"
                onClick={() => {
                  deleteShift(isEditingShift);
                  setIsEditingShift(null);
                  setIsAddingShift(false);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                ลบเวร
              </Button>
            )}

            <div className="flex gap-2">
              <DialogClose asChild>
                <Button variant="outline">ยกเลิก</Button>
              </DialogClose>

              <Button
                onClick={isEditingShift ? saveEditedShift : addShift}
                disabled={!newShift.startTime || !newShift.endTime}
              >
                {isEditingShift ? "บันทึกการแก้ไข" : "เพิ่มเวร"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FAB สำหรับมือถือ */}
      {isMobile && selectedDate && (
        <Button
          className="fixed right-4 bottom-16 rounded-full w-14 h-14 shadow-lg z-20 ios-safe-area-bottom"
          onClick={() => setIsAddingShift(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}
