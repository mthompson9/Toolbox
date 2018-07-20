import React from 'react';
import axios from 'axios';
import {TextField, DatePicker} from 'material-ui';
import {Link} from 'react-router-dom'
import {api, dateFunctions} from '../../../common'
import {timerange, TimeRange} from 'pondjs'

import {
    AreaChart,    Baseline,    BoxChart,    Brush,    LabelAxis,    Resizable,    ValueAxis,        Legend,        Charts,    ChartContainer,    ChartRow,    YAxis,    LineChart,    BarChart,    styler
} from "react-timeseries-charts";

import { TimeSeries, Index } from "pondjs";


// Displays the sensor measurements on a graph
export default class DisplaySensors extends React.Component {

    constructor(props)  {
        super(props)

        this.state = {
            series: null,
            loaded: false,
            data: null,
            experiment_details: {},
            startDate: null,
            userChangedGraph: false,
            userChangedTime: null
        }
    }

    //if the user has moved the range or zommed in then load and update
    checkChanges = () => {
        if (this.state.userChangedGraph) {
            let diffInMilli = ( Date.now() - this.state.userChangedTime  );
            if (diffInMilli > 50) {
                
                let beginTime = this.state.timerange.begin();
                let endTime = this.state.timerange.end();

                beginTime = dateFunctions.subtractHours(beginTime, 2);
                endTime = dateFunctions.addHours(endTime, 2);

                this.loadData(this.props.sensor_ids, beginTime.toISOString() , endTime.toISOString(), this.state.timerange  )

                this.setState({userChangedGraph: false});
            }
            setTimeout(() => { this.checkChanges() }, 50);
        }
    }

    componentDidMount() {
        this.loadData( this.props.sensor_ids, this.props.start_date, this.props.end_date);
    }

    componentWillReceiveProps(newProps) {
        this.loadData( newProps.sensor_ids, newProps.start_date, newProps.end_date);
    }

    //load the data for the sensors
    loadData(sensor_ids, start_date, end_date, userSetTimeRange = null) {
        if (sensor_ids === undefined) return;
        if (sessionStorage.getItem('CurrentUser') == undefined) {
            this.props.history.push('/admin/login')
        }
        
        const urlGetMeasurements =  api.getBasePath() + '/experiment_measurement?&order=when.asc&select=exp_sensor_id,value,when&exp_sensor_id=in.'
            + "(" + sensor_ids + ')&deleted=eq.false&when=gte.' + start_date + '&when=lte.' + end_date ;

        //get all results for this sensor
        axios.get(urlGetMeasurements)
        .then(res => {
            let chns = new Channels(this.props.sensor_type, userSetTimeRange);
            sensor_ids.forEach(id => {
                let chn = this.getChannelForSensor(res.data, id);
                if (chn.hasData())
                    chns.addChannel(chn);
            });

            let start_date_obj = dateFunctions.string_to_date(start_date);
            let end_date_obj = dateFunctions.string_to_date(end_date);
            let range = chns.timeRange();
            if (range == null)
                range = new TimeRange(start_date_obj, end_date_obj);

            this.setState( {
                    channels: chns,
                    loaded: true,
                    timerange: range
                }
            );

        });
    }

    //process the data and extract data for the specified sensor
    getChannelForSensor = (data, sensor_id) => {
        let series_points = [];
        let lastDate = null;

        data.forEach( data_item => {
            if (data_item.exp_sensor_id === sensor_id) {
                var value = data_item.value;
                var theMeasurementDate = dateFunctions.string_to_date(data_item.when);

                if (lastDate != null) {
                    //if there wasn't a measurement in 3 minutes then break the line since there's a gap
                    let timeDiffSec = (theMeasurementDate - lastDate) / 1000;
                    if (timeDiffSec > (60 * 3)) {
                        series_points.push( [ theMeasurementDate, null ] );
                    }
                }

                series_points.push( [ theMeasurementDate, value ] );
                lastDate = theMeasurementDate;
            }
        });

        const val = "value" + sensor_id;

        //construct the Time Series object with the data points above
        var ts = new TimeSeries({
            name: "name",
            columns: ["time", val],
            points: series_points
        });

        return new Channel(ts, val);
    }

    handleTrackerChanged = (t) =>  this.setState({tracker: t});

    //display the graph
    render() {
        const {channels} = this.state;

        var chart = "";
        var details = "";
        if (this.state.loaded) {
            
            //generate the styles.. TODO: need enough colours to cover the possible number of sensors
            var colours = ['black', 'blue', 'red', 'orange', 'green', 'purple'];
            var styles = [];
            var legendDetails = [];
            channels.channels.forEach( chn => {
                let col = colours.pop();
                styles.push({key:chn.columnName, color: col })
                legendDetails.push({key: chn.columnName, label: this.props.sensor_names})
            });
            const style = styler(styles);

            console.log('Simons style')
            console.log(style)
            console.log('some legend')
            console.log(legendDetails)


            //TODO: get the max range of all the series
            var rng = this.state.timerange;
            if (rng !== undefined)
             {

                console.log(this.props.sensor_names)

                // const trackerInfoValues = [
                //     {label: "Value", value: this.state.tracker == null ? "" : this.state.series.atTime(this.state.tracker).get('value1').toFixed(2)}
                // ];

                chart =  <div>
                    <Resizable>
                    <ChartContainer timeRange={ this.state.timerange} 
                        // trackerPosition={this.state.tracker}
                        // onTrackerChanged={this.handleTrackerChanged}
                        enablePanZoom={true}
                        onTimeRangeChanged={timerange => {
                            this.setState(
                                { 
                                    timerange: timerange,
                                    userChangedGraph: true, 
                                    userChangedTime: Date.now()
                                }, () => {
                                    this.checkChanges();
                                }
                            )
                        }}
                    >  

                        <ChartRow height="250"
                                // trackerInfoValues={trackerInfoValues}
                                // trackerInfoHeight={50}
                        >


                            <YAxis
                                id="theAxis"
                                label={ this.props.sensor_names + ' (' + this.props.sensor_units + ')'}
                                min={ channels.minValue() } 
                                max={ channels.maxValue() }

                                format=",.2f"/>

                            <Charts> 
                 

                                {channels.channels.map( chn => 
                                    <LineChart 
                                        key={chn.columnName}
                                        interpolation="curveLinear"
                                        smooth={false}
                                        columns={[chn.columnName]}
                                        breakLine
                                        axis="theAxis"
                                        series={chn.timeSeries}
                                        style={style}
                                        />
                                        
                                )}







                            </Charts>
                        </ChartRow>

                    </ChartContainer>   
                    </Resizable>
                    <Legend
                    type="swatch"
                    style={style}
                    categories={legendDetails}
                />     
                </div>;

                details = <div></div>
            }
        }      

        return (<div>
            {details}
            {chart}        
        </div>);
    }

}



class Channels {
    constructor(typeOfReading, userSetTimeRange) {
        this.channels = []
        this.typeOfReading = typeOfReading;
        this.userSetTimeRange = userSetTimeRange;
    }

    addChannel = (chn) => this.channels.push(chn);

    timeRange = () => {
        if (this.userSetTimeRange != null) {
            return this.userSetTimeRange;
        }
        else {
            if (this.channels[0] == null)
                return null;
            else
                return this.channels[0].timeSeries.timerange(); 
        }
    }//TODO: fix this

    //gets the minimim value among all the values in all data sources
    minValue = () => {
        let min = 10000000; //TODO: fix 

        //find the 
        this.channels.forEach( chn =>
            {
                let thisMin = chn.timeSeries.min(chn.columnName);
                if (thisMin < min) min = thisMin;
            }
        );

        return min;
    }


    maxValue = () => {
        let max = -100000000;
        this.channels.forEach( chn =>
            {
                let thisMax = chn.timeSeries.max(chn.columnName);
                if (thisMax > max) max = thisMax;
            }
        );

        return max;
    }
}

class Channel {
    constructor(timeSeries, valueColumnName) {
        this.timeSeries = timeSeries;
        this.columnName = valueColumnName;
    }

    hasData = () => {
        return this.timeSeries.count() > 0;
    }

    //timeSeries = () => this.timeSeries;
    // columnName = () => this.valueColumnName;
}