import React from 'react';

import axios from 'axios';
import * as api from '../../../common/api'
import FlatButton from 'material-ui/FlatButton';
import CircularProgressbar from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

//Shows a the circle with the current value of the sensor in it
export default class SensorOverview extends React.Component {

    constructor(props)  {
        super(props)

        this.state = {
            sensor_id: -1,
            loaded: false,
            sensor_data: { //example data
                "id": 10000,
                "exp_sensor_id": 2,
                "value": 38.0105051224604,
                "when": "2017-01-05T00:53:00"
            },
            sensor_info: {  //example sensor info, will get repalced
                "id": 1,
                "sensor_config_id": 6,
                "exp_device_id": 1,
                "name": "temp at top of soil2",
                "sensor_config": {
                    "id": 6,
                    "sensor_type_id": 4,
                    "serial_num": "C4:7C:8D:65:AC:5A-conductivity",
                    "sensor_type": {
                        "id": 4,
                        "name": "conductivity",
                        "description": "a desc",
                        "unit": "uS/cm"
                    }
                }
            }
        }
    }

    //when loadding for the first time
    componentDidMount() {
        this.loadData(this.props.sensor_id);
    }

    //load the data
    loadData(sensor_id) {
        //get the details of this experiment
        api.ExperimentSensor.getExperimentSensor( sensor_id)
        .then(res => {
            //set the config info
            this.setState({ sensor_info: res.data[0] });

            //get tha last recording for this sensor
            return api.ExperimentSensor.getLastMeasurement(sensor_id);

        }).then(res => {            
            this.setState({ sensor_data: res.data[0], loaded: true });
        })
    }

    //display the graph
    render() {
        const {loaded, sensor_info, sensor_data} = this.state;
        const sensor_type = sensor_info.sensor_config.sensor_type;
        if (!sensor_data) return [];

        return (<div>
                {loaded &&
                <div style={{ "padding": "20px"}} >
                        
                    <div style={ { "maxWidth": "80px" , "marginLeft": "auto", "marginRight": "auto" }}>
                        <CircularProgressbar 
                            percentage={ Number.parseFloat(sensor_data.value).toFixed(2) } 
                            textForPercentage={ pc => pc.toString() }
                            initialAnimation={1}
                            strokeWidth={2}
                            />

                            {sensor_info.name}
                    </div>
                        
                </div>
                }
        </div>);
    }
}