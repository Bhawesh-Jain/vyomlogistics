import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function customLog(message?: any, ...optionalParams: any[]) {
  console.dir({ message, optionalParams }, { depth: 100 })
}

export function getStatusColor(status: string) {
  var s = status.toString().trim();
  switch (s) {
    case "-10":
      return "text-destructive";
    case "-1":
      return "text-destructive";
    case "0":
      return "text-destructive";
    case "1":
      return "text-primary";
    case "10":
      return "text-warning";
    case "50":
      return "text-info";
    case "100":
      return "text-success";
    default:
      return "";
  }
}

export function getStatusName(status: string) {
  var s = status.toString().trim();
  switch (s) {
    case "-10":
      return "Deleted";
    case "-1":
      return "Rejected";
    case "0":
      return "Inactive";
    case "1":
      return "Active";
    case "10":
      return "Completed";
    case "100":
      return "Successful";
    default:
      return "";
  }
}


export function formatFileSize(file_size: string): string {
  const bytes = parseInt(file_size);
  if (isNaN(bytes)) return '0 B';

  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

export function getCurrencySymbol(currency: string): string {
  const currencySymbols: { [key: string]: string } = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    JPY: '¥',
    CNY: '¥',
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'CHF',
    SEK: 'kr',
    NZD: 'NZ$',
  };

  return currencySymbols[currency] || currency;
}
