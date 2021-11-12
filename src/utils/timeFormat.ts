import { format } from "date-fns";
import ptBR from "date-fns/locale/pt-BR";

export function dateTime(date: Date) {
  return format(
    date,
    "d MMM Y",
    {
      locale: ptBR
    }
  ) + ", às " + format(
    date,
    "HH:mm",
    {
      locale: ptBR
    }
  );
};