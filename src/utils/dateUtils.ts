export function getSundayOfCurrentWeek(): string {
    const today = new Date();
    const day = today.getDay(); // 0 (Sunday) to 6 (Saturday)

    // Calculate the difference to get to the previous Sunday (or today if it's Sunday)
    // If today is Sunday (0): diff = 0 -> today
    // If today is Monday (1): diff = 1 -> yesterday
    const diff = day;

    const sunday = new Date(today);
    sunday.setDate(today.getDate() - diff);

    const year = sunday.getFullYear();
    const month = String(sunday.getMonth() + 1).padStart(2, '0');
    const date = String(sunday.getDate()).padStart(2, '0');

    return `${year}-${month}-${date}`;
}
