export class DateUtils {
    // 指定した年月の月の日数を取得
    static getDaysInMonth(year: number, month: number): number {
        return new Date(year, month, 0).getDate();
    }
}