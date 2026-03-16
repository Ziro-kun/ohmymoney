const transactionsData = [
  { id: 1, date: "2024-01-15", recurringDay: 15, isFixed: true, type: "expense", amount: 1000, description: "Rent" }
];

const todayStr = "2024-03-16";
const today = new Date(todayStr);
const currentYear = today.getFullYear();
const currentMonth = today.getMonth();
const currentDay = today.getDate();

const expandedTransactions = [];

for (const tx of transactionsData) {
  expandedTransactions.push(tx);
  
  if (tx.isFixed && tx.recurringDay) {
    const startDate = new Date(tx.date);
    let year = startDate.getFullYear();
    let month = startDate.getMonth() + 1; // start from next month

    while (year < currentYear || (year === currentYear && month <= currentMonth)) {
      if (year === currentYear && month === currentMonth && currentDay < tx.recurringDay) {
        break; // not yet reached the recurring day this month
      }

      // Check if we have passed the end of the month (e.g. Feb 31 -> Feb 28)
      // For simplicity, just use recurringDay. If month doesn't have 31 days, it might wrap, but assuming recurringDay is 1-31.
      const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
      const actualDay = Math.min(tx.recurringDay, lastDayOfMonth);

      const vDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(actualDay).padStart(2, '0')}`;
      
      expandedTransactions.push({
        ...tx,
        id: parseInt(`${tx.id}${year}${String(month + 1).padStart(2, '0')}`, 10) * -1, // Negative ID for virtual
        date: vDateStr,
        description: `${tx.description} (정기)`
      });

      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
    }
  }
}

console.log(expandedTransactions);
