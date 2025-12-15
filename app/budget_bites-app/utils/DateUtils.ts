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
}