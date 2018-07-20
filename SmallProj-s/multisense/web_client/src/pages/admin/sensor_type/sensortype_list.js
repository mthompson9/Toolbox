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


class SensorTypeList extends React.Component {


    constructor(props) {
        super(props);
    
        this.state = {
            loaded: false,
            experiments: [],
            editButtonPressed: false
        }
      }
    
      //on load get the latest
      componentDidMount() {
       this.refresh();
      }
    

      refresh() {
        api.SensorType.getSensorTypes()
        .then(res => {
            this.setState( { SensorTypes: res.data, loaded:true  } )
        });
      }
    
      selectedEdit = (exp_id) => {
        this.state.editButtonPressed = true;
        this.props.history.push("/admin/sensor_type/" + exp_id);
      }
    
      render() {
        var table = [];
    
        if (this.state.loaded) {
    
            var rows = this.state.SensorTypes.map( (item) => 
                <TableRow key={item.id}  >
                    <TableRowColumn>
                    <EditIcon  color={blue500}  hoverColor={yellow500} onClick={ () => this.selectedEdit(item.id)  } />
    

                    </TableRowColumn>
                    <TableRowColumn>{item.name}</TableRowColumn>
                    <TableRowColumn>{item.description}</TableRowColumn>
                    <TableRowColumn>{item.date_created}</TableRowColumn>
                    <TableRowColumn>{item.unit}</TableRowColumn>
                    
                </TableRow>
            );
    
            var table = (
                <Table >
                <TableHeader displaySelectAll={false} adjustForCheckbox={false}>
                    <TableRow>                    
                        <TableHeaderColumn>
                        </TableHeaderColumn>
                        <TableHeaderColumn>Sensor Type</TableHeaderColumn>
                        <TableHeaderColumn>Description</TableHeaderColumn>
                        <TableHeaderColumn>Date Created</TableHeaderColumn>
                        <TableHeaderColumn>Unit</TableHeaderColumn>
                        
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
          <RaisedButton label="Create" primary={true} style={style} onClick={ () => this.props.history.push("/admin/sensor_type")  } />
          </div>
        );
      }
    
    }
    


export default withRouter(SensorTypeList);
