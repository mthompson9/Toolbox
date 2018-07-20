import { DatePickerDialog } from 'material-ui/DatePicker/DatePickerDialog';

var moment = require('moment');

export function string_to_date(when) {
    var date = moment(when).toDate();
    return date;
}

export function date_to_string(when) {
    return moment(when).format('MMMM Do YYYY, h:mm:ss a');
}

export function subtractHours(dateObj, hours) {
    return moment(dateObj).subtract(hours, 'hours').toDate();
}


export function addHours(dateObj, hours) {
    return moment(dateObj).add(hours, 'hours').toDate();
}
