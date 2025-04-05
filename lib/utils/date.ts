import { format } from "date-fns";
import { th } from "date-fns/locale";

export const formatDate = (date: Date | string) => {
  const dateObject = date instanceof Date ? date : new Date(date);
  const bkkTime = new Date(dateObject.getTime() + 7 * 60 * 60 * 1000);
  return format(bkkTime, "dd MMM yyyy, HH:mm", { locale: th });
};
