import React from 'react';
import {Link} from 'react-router-dom'
import ReactTable from 'react-table'
import 'react-table/react-table.css'
import RaisedButton from 'material-ui/RaisedButton/RaisedButton';
import {withRouter} from "react-router-dom";
import {dateFunctions} from "../../../common";

function roundMinutes(when) {
    const date_part = when.substr(0,17);
    const second_part = Math.round(when.split(':')[2]);

    if (second_part < 10){
        var time_stamp = date_part + '0' + second_part;
    } else {
        var time_stamp = date_part + second_part;
    }

    return time_stamp.replace("T", " ");
}

export default class DisplayTable extends React.Component {

    constructor(props)  {
        super(props)

        this.state = {
            sensor_readings: null,
        }
    }

    componentDidMount() {
        this.loadData(this.props.table_of_results);
    }

    componentWillReceiveProps(newProps) {
        this.loadData(newProps.table_of_results);
    }

    loadData(fetch_resp) {
        this.setState( {
            sensor_readings: fetch_resp,
        }
    );
    }

    render() {
        //For ReactTable; data works like <td> cells and columns works like <tr> headers
        var data = [];
        var columns = [];

        //create a table head for time and each sensor in the experiment
        columns.push({Header: 'Time', accessor: 'time'})
        this.props.table_of_results.forEach (tableVal => {
            //accessor is used for identifying which row header a value should fall under and is used by Data[]
            columns.push({Header: tableVal.name, accessor: tableVal.name});
        })
        
        //Use a hashmap as the means of storing the entries from db for the table to display
        var time_to_vals = {}
        //ReactTable requires the key of an object match column accessor to display under that column so 'time' needs to be included
        var time_key = 'time';
        //This is the iteration limit for var j which is just the size of columns minus 1 because indexing of j begins at 0
        var number_of_sensors = columns.length-1

        // For 900 entries (Maybe the user could specify the number of iterations themselves)
        for (var i = 0;i < 900;i++){              
            //for each sensor in the experiment - start j at 0 because table_results stores the first sensor at [0]
            for (var j = 0;j<number_of_sensors;j++){
                var sensor_data = this.props.table_of_results[j].experiment_measurement[i];
                //Need to handle undefined situations(accessing array out of its bounds for instance)
                if (sensor_data !== undefined) {
                    //This date formatting can probably be replaced by now depending on what's used in the AWS build
                    var current_time_measure = new Date(roundMinutes(sensor_data.when));
                    //var insert_measure = current_time_measure.toString();

                    var insert_measure = dateFunctions.date_to_string(current_time_measure);
                    var current_value_measure = this.props.table_of_results[j].experiment_measurement[i].value;
                    current_value_measure = Number(current_value_measure);
                    current_value_measure = +current_value_measure.toFixed(2);  //Note: the + makes it drop any trailing zeros so 12.00 becomes 12
                    var current_sensor_name = this.props.table_of_results[j].name;

                    //If the time for the ith entry of a sensor does not match any that already exist, create a new hash for it
                    if (time_to_vals[current_time_measure] == undefined) time_to_vals[current_time_measure] = {};
                    time_to_vals[current_time_measure][time_key] = insert_measure;
                    time_to_vals[current_time_measure][(current_sensor_name)] = current_value_measure;
                    //If accessing a value at a location results in a response of undefined, simply skip for that iteration                 
                } else {
                }
            } 
        }

        //Take the hashmap and return the objects sorted with the collected data for each key
        var times = Object.keys(time_to_vals).sort( 
            (a, b) => new Date(b.date) - new Date(a.date)
        );

        times.forEach(time => {
            var readings = time_to_vals[time];
            //ReactTable expects an array[] called data so the output must be stored in it to display on page
            data.push(readings)
        });

        //An Invalid Date was picked up during testing which sorted to the front of the array, so shift was used to remove it
        data.shift();

        //For some reason the first entry is a random entry while the others are fine
        data.shift();

        return        <div>
                      <ReactTable ref="experiment_table"
                      data={data}
                      columns={columns}
                      defaultPageSize={10}/>
                      </div>
    }   
}