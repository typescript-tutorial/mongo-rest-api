export class DateUtil {
  public static now(): Date {
    return new Date();
  }
  public static addSeconds(date: Date, number: number) {
    const newDate = new Date(date);
    newDate.setSeconds(newDate.getSeconds() + number);
    return newDate;
  }
  public static addDays(date: Date, number: number) {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + number);
    return newDate;
  }
  public static compareDateTime(date1: Date, date2: Date) {
    if (!date1 && !date2) {
      return 0;
    } else if (!!date1 && !date2) {
      return 1;
    } else if (!date1 && !!date2) {
      return -1;
    } else {
      return (date1.getTime() - date2.getTime());
    }
  }
  public static before(date1: Date, date2: Date): boolean {
    if (date1 === null || date2 === null) {
      return false;
    }
    if (date1.getTime() - date2.getTime() < 0) {
      return true;
    }
    return false;
  }

  public static after(date1: Date, date2: Date): boolean {
    if (date1 === null || date2 === null) {
      return false;
    }
    if (date1.getTime() - date2.getTime() > 0) {
      return true;
    }
    return false;
  }

  public static equal(date1: Date, date2: Date): boolean {
    if (date1 === null || date2 === null) {
      return false;
    }
    if (date1.getTime() - date2.getTime() === 0) {
      return true;
    }
    return false;
  }

  // return milliseconds
  public static sub(date1: Date, date2: Date): number {
    return Math.abs((date1.getTime() - date2.getTime()));
  }

  public static addHours(date: Date, number: number) {
    // return moment(date).add(number, 'hours').toDate();
    const newDate = new Date(date);
    newDate.setHours(newDate.getHours() + number);
    return newDate;
  }

}
