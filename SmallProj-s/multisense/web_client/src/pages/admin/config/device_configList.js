import React from 'react';

import {RaisedButton, FlatButton} from 'material-ui';
import axios from 'axios';
import {withRouter} from "react-router-dom";
import EditIcon from 'material-ui/svg-icons/editor/mode-edit';
import {red500, yellow500, blue500} from 'material-ui/styles/colors';
import {api, urlFunctions, styles} from '../../../common'
import {TextField} from 'material-ui';

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


class DeviceConfigList extends React.Component {

    constructor(props) {
        super(props);
    
        this.state = {
            loaded: false,
            experiments: [],
            DeviceConfigs: [],
            editButtonPressed: false
        }
      }
    
      //on load get the latest
      componentDidMount() {
       this.refresh();
      }
    
    
      refresh() {
        api.DeviceConfig.getDeviceConfigs()
        .then(res => {
            this.setState( { DeviceConfigs: res.data, loaded:true  } )
        });
        api.DeviceConfig.getDeviceTypes() //also have to pull in all types from this table 
        .then(res => { 
            this.setState( { types: res.data, loaded:true, done: true  } )
        })
      
      }
    
      selectedEdit = (exp_id) => {
        this.state.editButtonPressed = true;
        this.props.history.push("/admin/device_configs/" + exp_id);
      }

      //get the types to display in the list 
      getDeviceType = (id) => { 
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
    
            var rows = this.state.DeviceConfigs.map( (item) => 
                <TableRow key={item.id}  >
                    <TableRowColumn>
                    <EditIcon  color={blue500}  hoverColor={yellow500} onClick={ () => this.selectedEdit(item.id)  } />
    
                    </TableRowColumn>
                    <TableRowColumn>{this.getDeviceType(item.device_type_id)}</TableRowColumn>
                    <TableRowColumn>{item.serial_num}</TableRowColumn>
                    <TableRowColumn>{item.description}</TableRowColumn>
                    <TableRowColumn>{item.location}</TableRowColumn>                    
                    <TableRowColumn>{item.hardware_version}</TableRowColumn>
                    
                    
                </TableRow>
            );
    
            var table = (
                <Table >
                <TableHeader displaySelectAll={false} adjustForCheckbox={false}>
                    <TableRow>                    
                        <TableHeaderColumn>
                        </TableHeaderColumn>
                        <TableHeaderColumn>Device Type</TableHeaderColumn>
                        <TableHeaderColumn>Serial Number</TableHeaderColumn>
                        <TableHeaderColumn>Description</TableHeaderColumn>
                        <TableHeaderColumn>Location</TableHeaderColumn>                        
                        <TableHeaderColumn>Hardware Version</TableHeaderColumn>

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
          <RaisedButton label="Create" primary={true} style={style} onClick={ () => this.props.history.push("/admin/device_configs")  } />
          </div>
        );
      }
    
    }
    
       
      
    


export default withRouter(DeviceConfigList);
