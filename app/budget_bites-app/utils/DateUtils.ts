export interface WeekRange {
    weekNumber: number;
    startDate: string;
    endDate: string;
}

export class DateUtils {
    // 指定した年月の月の日数を取得
    static getDaysInMonth(year: number, month: number): number {
        return new Date(year, month, 0).getDate();
    }

    static numberToTimeString(hour: number, minute: number = 0): string {
        const h = (hour % 24).toString().padStart(2, '0');
        const m = minute.toString().padStart(2, '0');
        return `${h}：${m}`;
    };
    static formatDate(date: Date): string {
        return `${date.getMonth}-${date.getDay}`;
    }

    static isToday(trigger: { date?: string | number | Date }): boolean {
        if (!trigger.date) return false;

        const triggerDate = new Date(trigger.date);
        const today = new Date();

        return (
            triggerDate.getFullYear() === today.getFullYear() &&
            triggerDate.getMonth() === today.getMonth() &&
            triggerDate.getDate() === today.getDate()
        );
    }

    /**
     * 指定した月の週範囲を取得する
     * @param month "YYYY-MM" 形式の月
     * @returns WeekRange[] 週範囲の配列
     */
    static getWeekRanges(month: string): WeekRange[] {
        const [year, monthNum] = month.split('-').map(Number);
        const firstDay = new Date(year, monthNum - 1, 1);
        const lastDay = new Date(year, monthNum, 0);
        const daysInMonth = lastDay.getDate();

        const weeks: WeekRange[] = [];
        let currentDate = 1;
        let weekNumber = 1;

        while (currentDate <= daysInMonth) {
            const startDate = `${month}-${String(currentDate).padStart(2, '0')}`;
            const endDay = Math.min(currentDate + 6, daysInMonth);
            const endDate = `${month}-${String(endDay).padStart(2, '0')}`;

            weeks.push({
                weekNumber,
                startDate,
                endDate
            });

            currentDate = endDay + 1;
            weekNumber++;
        }

        return weeks;
    }

    /**
     * 日付文字列をフォーマットする
     * @param dateStr "YYYY-MM-DD" 形式の日付
     * @returns "YYYY-MM-DD" 形式のまま返す
     */
    static formatDateString(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}