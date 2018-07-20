import React from 'react';
import {SelectField, MenuItem, RaisedButton, TextField} from 'material-ui';
import axios from 'axios';
import * as api from '../../../common/api'

import {
    Table,
    TableBody,
    TableHeader,
    TableHeaderColumn,
    TableRow,
    TableRowColumn,
} from 'material-ui/Table';

export default class SensorsTable extends React.Component {

    constructor(props)  {
        super(props)
    }

    selectedRow = (index) => {
        if (index === undefined) return;
        
        let id = this.props.experiment_sensors[index].id;
        this.props.onSelection(id);
    }

    render() {
        return (
             <div style={{maxWidth: 500}}>
                    <Table onRowSelection={ (selectedIndexesArr) => this.selectedRow(selectedIndexesArr[0]) }>
                    <TableHeader displaySelectAll={false} adjustForCheckbox={false}>
                        <TableRow>                    
                            <TableHeaderColumn>Name</TableHeaderColumn>
                            <TableHeaderColumn>Serial</TableHeaderColumn>
                            
                        </TableRow>
                    </TableHeader>

                    <TableBody displayRowCheckbox={false}                
                        deselectOnClickaway={true}
                        showRowHover={true}
                        stripedRows={false}>
                    
                        {
                            this.props.experiment_sensors.map( device => 
                                <TableRow key={device.id}  >
                                    <TableRowColumn>{device.name}</TableRowColumn>
                                    <TableRowColumn>{device.sensor_config.serial_num}</TableRowColumn>


                                </TableRow>
                            )
                        }
                    </TableBody>
                    </Table>
                </div>
        );
    }

}


