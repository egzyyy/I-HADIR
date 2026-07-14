export const formatStandardDate = (dateString: string | undefined | null): string => { 
  if (!dateString || !dateString.includes('-')) {
    return 'N/A'; 
  }

  const [yyyy, mm, dd] = dateString.split('-');
  if (yyyy.length === 4) {
    return `${dd}/${mm}/${yyyy}`;
  }

  return `${yyyy}/${mm}/${dd}`;
};