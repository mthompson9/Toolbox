import React from 'react';
import axios from 'axios';
import {Link} from 'react-router-dom'
import ReactTable from 'react-table'
import {Tabs, Tab, FlatButton, Slider, TextField, DatePicker} from 'material-ui';
import 'react-table/react-table.css'
import {withRouter} from "react-router-dom";
import {api, dateFunctions} from '../../common'
import DisplaySensors from './components/display_sensors'
import DisplayTable from './components/display_table'
import SensorOverview from './components/sensor_overview'

import {
    Charts,
    ChartContainer,
    ChartRow,
    Legend,
    YAxis,
    LineChart,
    BarChart,
    styler
} from "react-timeseries-charts";


import { TimeSeries, Index } from "pondjs";
import EnhancedSwitch from 'material-ui/internal/EnhancedSwitch';
import { lightBlue100, lightGreen300 } from 'material-ui/styles/colors';
import { lightGreen100 } from 'material-ui/styles/colors';

// var moment = require('moment');
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

export default class DisplayMeasurements extends React.Component {

    constructor(props)  {
        super(props)

        this.state = {
            type_to_sensor: {},
            sensor_ids: {},
            loaded: false,
            data: null,
            experiment_details: {},
            startDatePicker: null,
            initial_fetch_hours: 6,
            days_slider: 0,
            nodata: true,
            experiment_number: 0,
            xdat: [],
        }
    }

    componentDidMount() {
        this.loadData( this.getExperimentId() );
    }
     
    componentWillReceiveProps(newProps) {
        this.loadData( newProps.match.params.id );
    }

    //get the experiment id from the url
    getExperimentId = () => this.props.match.params.id;
    

    handleDateChange = (event, date) => {
        this.setState({startDatePicker: date});
    };

    changeSlider = (val) => {
        this.setState({days_slider: val} );
    }

    sensorTypeIdToName = (id) => {
        const sensor_type_name = this.state.sen_type_id_to_name[id];
        return sensor_type_name; 
    }

    loadData = (exp_id) => {
        var sensor_ids = [];
        var table_results = [];
        let sen_type_id_to_name = {}
        let sensor_unit_measurement = {}

        //get the details of this experiment
        axios.get(api.getBasePath() + '/experiment?select=*, experiment_device(*, device_config(*),  experiment_sensor(*, sensor_config(*, sensor_type(*))))&id=eq.' + exp_id)            
        .then(res => {            
            //get the ids of the sensors for this experiment            
            res.data.map (exp => {
                exp.experiment_device.map (dev => {
                    if (dev.experiment_sensor !== undefined) {
                        dev.experiment_sensor.forEach (sensor => {
                            sensor_ids.push(sensor.id);

                            const sen_type_id = sensor.sensor_config.sensor_type.id;
                            const sen_type_name = sensor.sensor_config.sensor_type.name;
                            const sensor_unit = sensor.sensor_config.sensor_type.unit;
                            sen_type_id_to_name[sen_type_id] = sen_type_name;
                            sensor_unit_measurement[sen_type_id] = sensor_unit
                        })
                    }   
                })
            });

            this.setState({sen_type_id_to_name: sen_type_id_to_name, sensor_unit_measurement: sensor_unit_measurement});

            //get 10 entries from the database in descending order
            return axios.get(api.getBasePath() + '/experiment?select=*, experiment_device(*, experiment_sensor(*, experiment_measurement(when, value)))&experiment_device.experiment_sensor.experiment_measurement.order=when.desc&experiment_device.experiment_sensor.experiment_measurement.limit=1000&id=eq.' + exp_id);

        }).then(resTable => {         
            //get the ids of the sensors for this experiment            
            resTable.data.map (exp => {
                exp.experiment_device.map (dev => {
                    if (dev.experiment_sensor !== undefined) {
                        dev.experiment_sensor.forEach (tableVal => {
                            table_results.push(tableVal);
                            this.state.xdat.push(tableVal)
                        })
                    }   
                })
            }); 
            
            this.setState( {experiment_details: resTable.data[0], sensor_ids: sensor_ids, table_results: table_results } )

            //get the last there was any result for this experiment
            return axios.get(api.getBasePath() + '/experiment_measurement_summary_minute_view?order=when.desc&limit=1&select=when&exp_sensor_id=in.(' + sensor_ids + ')' );
               
        }).then(latest_measurement_time => {
            this.identifyDataType();
            const {initial_fetch_hours} = this.state;

            if (latest_measurement_time.data[0] != null){
                //calculate 7 days before the end of the last measurement
                var when = latest_measurement_time.data[0].when;
                var start_date = dateFunctions.string_to_date(when);
                start_date = dateFunctions.subtractHours(start_date, initial_fetch_hours);

                this.setState( {
                        loaded: true,
                        sensor_ids: sensor_ids,
                        startDatePicker: start_date,                        
                        nodata:false
                    }
                );    
            } else {
                this.setState({nodata:true});
            }
        
        }).catch( (error) => {
            api.processError(error);
        });

        
    }

    identifyDataType = () => { 
        let sensor_list = this.state.sensor_ids.toString()
        axios.get(api.getBasePath() + '/experiment_sensor?id=in.(' + sensor_list + ')&select=*,sensor_config(*,%20sensor_type(*))')
        .then ( all_sensors => { 
            all_sensors = all_sensors.data;
            let type_to_sensor = {}
            let exp_sensor_names = {}
            var currsen = 0;

            all_sensors.forEach( sensor => { 
                const sensor_type_id = sensor.sensor_config.sensor_type_id;
                console.log('HERE BOI')
                console.log(sensor)
                console.log(currsen)
                console.log('sensor type id = ' + sensor_type_id)
                //if not present then add empty array
                if (!type_to_sensor.hasOwnProperty(sensor_type_id) )
                type_to_sensor[sensor_type_id] = [];
                exp_sensor_names[currsen] = [];

                console.log('pollocks')
                console.log(sensor_type_id)

                let arr = type_to_sensor[sensor_type_id];
                arr.push( sensor.id );
                console.log('our type to sensor')
                console.log(type_to_sensor)
                console.log(exp_sensor_names)
                currsen = currsen+1;
            });

            this.setState( { type_to_sensor: type_to_sensor  } );
        })
    }

    exportSensorReadings = () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        var headingCSV =  'Sensor' + ',' + 'Value' + ',' + 'Time';
        let data = this.state.xdat
        let final = ''

        data.forEach( set => { 
            let something = set.experiment_measurement
            let name = set.name
            something = Array.prototype.slice.call(something)
            // console.log(something)
            something.forEach( measurement => { 
                let value = measurement.value;
                let when = measurement.when
                let string = name + ',' + value + ',' + when
                final = final + string + '\r'
            })

        })
        
        csvContent += headingCSV + "\r\n" + final; // add carriage return 
        var encodedUri = encodeURI(csvContent);
        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "eexperiment_export_" + this.getExperimentId() + ".csv");
        document.body.appendChild(link); // Required for FF
        
        link.click();
    }

    render() {
        
        const {sensor_ids} = this.state;
        var Temp_chart = [];
        var Light_chart = [];
        var Conductivity_chart = [];
        var Moisture_chart = [];
        var Battery_chart = []; 
        var details = [];
      
        //For ReactTable; data works like <td> cells and columns works like <tr> headers
        let tabs = [];

        console.log('THIS IS THE SATE')
        console.log(this.state)

        if (this.state.loaded) {
        
            //get the start date          
            const {initial_fetch_hours} = this.state;
            let start_date = this.state.startDatePicker.toISOString();
            let end_date = dateFunctions.addHours(this.state.startDatePicker, initial_fetch_hours).toISOString();

            // let days = (this.state.days_slider * 7) + 0.1; //minimim or .1 days, from 0.1 to 30 days
            // end_date.setDate( this.state.startDatePicker.getDate() + days + 0.05);
            // end_date = end_date.toISOString();

            var fetch_res = this.state.table_results;

            details = <div>
                Experiment Name: {this.state.experiment_details.name}
                <br/>
                Description: {this.state.experiment_details.description}
                <br/>

                <DatePicker
                    floatingLabelText="Start date"
                    value={this.state.startDatePicker}
                    onChange={this.handleDateChange}
                    autoOk={true} />

            </div>        

            const {type_to_sensor} = this.state;
            const {fetch_sensor_entries} = this.state;

            var ij = 0;

            //create charts - dynamically in tabs
            for (var sens_type in type_to_sensor) {
                console.log('sens_type = ' + sens_type)
                console.log('this is type to sensor')
                console.log(this.state)
                if (type_to_sensor.hasOwnProperty(sens_type)) {
                    var sensor_name = this.sensorTypeIdToName(sens_type) //get the verbose name of the type of sensor based on the id of said sensor
                    // sensor_name = sensor_name + '  (55C)' <= a possible addition, that would display the current value in the tab. 
                    const sensor_ids_arr = type_to_sensor[sens_type];
                    const sensor_names_arr = this.state.sen_type_id_to_name[sens_type];
                    const sensor_units_arr = this.state.sensor_unit_measurement[sens_type];
                    
                    console.log('what is this')
                    console.log(sensor_name)

                    console.log('the number of loops for displaysensors')
                    console.log(ij)
                    tabs.push(                    
                        <Tab label={sensor_name} >
                        <div>
                        { <div style={ {float: 'right'} }>
                            <FlatButton
                            label="Export data"
                            backgroundColor={lightBlue100}
                            style={{"margin": "10px"}}
                            onClick={ this.exportSensorReadings }
                            />
                            </div> 
                            
                        }               

                            <div  style={ {width: '100%'}} >
                                <div >

                                    {/* display the sensor circles */}
                                    <div style={{"display": "flex"}}>
                                    { sensor_ids_arr.map( id => 
                                        <SensorOverview key={id} sensor_id={id} />
                                    )}
                                    </div>
                                    
                                    <DisplaySensors key={sensor_ids_arr} sensor_ids={sensor_ids_arr}  start_date={start_date} end_date={end_date} sensor_units={sensor_units_arr} sensor_names={sensor_names_arr} />
                                </div>
                            </div>
                {/* sensor_type={sensor_name} */}

                            <div style={{paddingTop: "20px" }}>                            
                                Measurements:
                            </div>
                            <div >
                                <DisplayTable key={fetch_res} table_of_results={fetch_res} />
                            </div>
                            
                        </div>
                        </Tab>
                    );
                    ij = ij+1;
                    console.log('FSNVIDSONVDISNVDIO')
                    console.log(sensor_ids_arr)
                }  
            }
        }     

        const numOfSensorTypes = Object.keys(this.state.type_to_sensor).length;

        return (       
            <div> 
                {!this.state.nodata &&               
                    <Tabs tabItemContainerStyle={{backgroundColor: "#81d4fa"}} style={{border: "1px", "border-style": 'solid', "border-color": "#efebe9"}}   >
                        {tabs}
                    </Tabs>
                }


                {this.state.nodata &&               
                    <div>
                        Experiment Name: {this.state.experiment_details.name}
                        <br/>
                        Description: {this.state.experiment_details.description}
                        <br/>
                        <br/>
                        <b>No data has been collected.</b>
                    </div>
                }

            </div>
        );
                
    }
}


//Shoutouts to SimpleFlips