import React, { Component } from 'react';
import {Map, InfoWindow, Marker, GoogleApiWrapper} from 'google-maps-react';
//Extra imports if you wanna merge both the card and map into 1 file.
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
 
export class MapContainer extends Component {

    



  render() {
      //styles 
    const style = {
        example: {
            //Change these to % to help make responsive
            //change values to resize.
            width: 1000,
            height: 1000
        },
    }

    return (

        //Further types of map available. Just went for ths as standard.
      <Map google={this.props.google} zoom={14} style={style.example}>
 
        <Marker onClick={this.onMarkerClick}
                name={'Current location'} />
 
        <InfoWindow onClose={this.onInfoWindowClose}>
            
        </InfoWindow>
      </Map>
    );
  }
}

//personal auth credentials for project but fine to use since its setup already
 
export default GoogleApiWrapper({
  apiKey: ("AIzaSyDzRilLJZykOuCSlmiFAV55kNjjROnnlys")
})(MapContainer)
