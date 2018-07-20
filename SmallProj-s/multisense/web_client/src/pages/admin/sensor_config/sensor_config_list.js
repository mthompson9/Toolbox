import React from 'react';

import {RaisedButton, FlatButton} from 'material-ui';
import axios from 'axios';
import {withRouter} from "react-router-dom";
import EditIcon from 'material-ui/svg-icons/editor/mode-edit';
import {red500, yellow500, blue500} from 'material-ui/styles/colors';
import {api, urlFunctions, styles} from '../../../common'


import {
    Table,
    TableBody,
    TableHeader,
    TableHeaderColumn,
    TableRow,
    TableRowColumn,
  } from 'material-ui/Table';

const style = {
    margin: 12,
};


class SensorConfigList extends React.Component {


    constructor(props) {
        super(props);
    
        this.state = {
            loaded: false,
            configs: [],
            editButtonPressed: false
        }
      }
    
      //on load get the latest
      componentDidMount() {
       this.refresh();
      }
    
    
      refresh() {
        api.SensorConfig.getSensorConfigs() //pull in all existing sensor configs whos delete = false
        .then(res => {
            this.setState( { configs: res.data, loaded:true  } )
        });
        api.SensorConfig.getSensorTypes() //also have to pull in all types from this table 
        .then(res => { 
            this.setState( { types: res.data, loaded:true, done: true  } )
        })
      }
    
      selectedEdit = (config_id) => {
        this.state.editButtonPressed = true;
        this.props.history.push("/admin/sensor_config_new/" + config_id);
      }

      //get the types to display in the list 
      getSensorType = (id) => { 
          while (this.state.done) { 
          let types = this.state.types;
          let type = types.filter(obj => obj.id == id)
          type = type[0].name
          return type
          }
      }
      
      render() {
        var table = [];
    
        if (this.state.loaded) {
    
            var rows = this.state.configs.map( (item) => 
                <TableRow key={item.id}  >
                    <TableRowColumn>
                    <EditIcon  color={blue500}  hoverColor={yellow500} onClick={ () => this.selectedEdit(item.id)  } />
    
                    </TableRowColumn>
                    <TableRowColumn>{item.serial_num}</TableRowColumn>
                    <TableRowColumn>{this.getSensorType(item.sensor_type_id)}</TableRowColumn>
                    
                </TableRow>
            );
    
            var table = (
                <Table >
                <TableHeader displaySelectAll={false} adjustForCheckbox={false}>
                    <TableRow>                    
                        <TableHeaderColumn>
                        </TableHeaderColumn>
                        <TableHeaderColumn>Serial Number</TableHeaderColumn>
                        <TableHeaderColumn>Sensor Type</TableHeaderColumn>
                    </TableRow>
                </TableHeader>
    
                <TableBody displayRowCheckbox={false}                
                    deselectOnClickaway={true}
                    showRowHover={true}
                    stripedRows={false}>
                    {rows}
                </TableBody>
                </Table>
            );
        }
    
        return (
          <div>{table}
          <RaisedButton label="Create" primary={true} style={style} onClick={ () => this.props.history.push("/admin/sensor_config_new")  } />
          </div>
        );
      }
    
    }
    


export default withRouter(SensorConfigList);