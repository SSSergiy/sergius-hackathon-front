export const parseAndFormatDate_DDMMYYYY_to_YYYYMMDD = (dateString_DDMMYYYY) => {
  if (!dateString_DDMMYYYY || typeof dateString_DDMMYYYY !== 'string') {
    return '';
  }
  try {
    const parts = dateString_DDMMYYYY.split('.');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      if (parseInt(year, 10) > 1000 && parseInt(month, 10) >= 1 && parseInt(month, 10) <= 12 && parseInt(day, 10) >= 1 && parseInt(day, 10) <= 31) {
        const formatted = `${year}-${month}-${day}`;
        const checkDate = new Date(formatted + 'T00:00:00');
        if (!isNaN(checkDate.getTime()) && checkDate.getFullYear() === parseInt(year, 10) && (checkDate.getMonth() + 1) === parseInt(month, 10) && checkDate.getDate() === parseInt(day, 10)) {
          return formatted;
        }
      }
    }
  } catch (e) { console.error("Error parsing/formatting date:", dateString_DDMMYYYY, e); }
  return '';
};