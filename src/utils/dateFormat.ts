import { format } from "date-fns";
import ptBR from "date-fns/locale/pt-BR";


export function dateFormat(date: Date, withAllInfo = false) {
  return format(
    date,
    withAllInfo? "d MMM y - HH:mm":"d MMM Y",
    {
      locale: ptBR
    }
  );
};