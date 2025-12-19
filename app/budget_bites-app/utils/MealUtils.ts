export class MealUtils {
    static getMealLabel(mealType: string): string {
        switch (mealType) {
            case 'breakfast':
                return '朝食';
            case 'lunch':
                return '昼食';
            case 'dinner':
                return '夕食';
            default:
                return '食事';
        }
    }
}