import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

//IMPORT MAP
import MapContainer from '../MapCard/Map' //relative path so change it for your config


//Alot of unnec styles but can make it easy to add labels or buttons or pictures etc so keeping for future. 
const styles = {
  card: {
    height: 'inhert',
    width: 'inhert',
  },
  bullet: {
    display: 'inline-block',
    margin: '0 2px',
    transform: 'scale(0.8)',
  },
  title: {
    marginBottom: 16,
    fontSize: 14,
  },
  pos: {
    marginBottom: 12,
  },
  media: {
    height: 0,
    paddingTop: '56.25%', // 16:9
  },
};


function popup(){
    window.alert("Some useful info")
}

function SimpleCard(props) {
  const { classes } = props;
  const bull = <span className={classes.bullet}>•</span>;

  
  return (
      //had to do some negative padding to get a hacky center align, probs copy the div styling in the MAP file
    <div style={{display: 'flex', justifyContent: 'center', marginTop: 50, marginLeft: -1000}}>
      <Card className={classes.card}>
        <MapContainer/> 
      </Card>
    </div>
  );
}

SimpleCard.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(SimpleCard);
