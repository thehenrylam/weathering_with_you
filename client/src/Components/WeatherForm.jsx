import React, {Component} from "react";
import {connect} from 'react-redux';
import {Form, Button, Row, Col, ButtonGroup, ToggleButton} from "react-bootstrap";

import axios from 'axios';

import {saveZipCode, saveWeatherData, saveTemperature, updateHistory} from "../actions";

class WeatherForm extends Component {
    // default state values
    state = {
        tempMetric: "imperial",
        zipCodeInput: "98052"
    }

    componentDidMount() {
        this.refreshSavedWeather();
    }

    // Refreshes the current weather data for the most recent zip code, if it exists
    refreshSavedWeather = () => {
        if (localStorage.getItem("zipCode")) {
            let zipCode = localStorage.getItem("zipCode");
            let tempMetric = localStorage.getItem("tempMetric");

            this.queryWeatherData(
                    zipCode, tempMetric
                ).then(d => {
                    this.props.saveWeatherData(d.data);
                    localStorage.setItem("CurrentWeatherData", JSON.stringify(d.data));
                });
        }
    }

    onChange = (e) => {
        this.setState({[e.target.name]: e.target.value});
    }

    saveFormData = (event) => {
        event.preventDefault();

        // Gets the weather data from the weather api and 
        // returns it to save into local storage and redux store.
        this.queryWeatherData(
                this.state.zipCodeInput, this.state.tempMetric
            ).then(response => {
                let weatherData = response.data;

                this.saveToStore(weatherData);
                this.saveToLocalStorage(weatherData);
            });
    }

    // Save data from form to local storage
    saveToLocalStorage = (weatherData) => {
        localStorage.setItem("zipCode", this.state.zipCodeInput);
        localStorage.setItem("tempMetric", this.state.tempMetric);
        localStorage.setItem("CurrentWeatherData", JSON.stringify(weatherData));
        localStorage.setItem("WeatherHistory", JSON.stringify(this.props.history));
    }

    queryWeatherData = (zipCode, tempMetric) => {
        return axios.post("api/weather", {zipCode: zipCode, tempMetric});
    }

    saveToMongo = (event) => {
        event.preventDefault();

        axios.post("api/weatherMongo", {
            zipCode: this.state.zipCodeInput,
            tempMetric: this.state.tempMetric
        }).then(response => {
            let weatherData = response.data;

            // Do what you want with the weather data
            this.saveToStore(weatherData);
            this.saveToLocalStorage(weatherData);
        }).catch(error => {
            console.log("saveToMongo() caught error:");
            console.log(error);
        });
    }

    // Saves data to the Redux store
    saveToStore = (weatherData) => {
        this.props.saveTemperature(this.state.tempMetric);
        this.props.saveZipCode(this.state.zipCodeInput);
        this.props.saveWeatherData(weatherData);

        this.props.updateHistory({
            timestamp: (new Date()).toLocaleString(),
            city: weatherData.name,
            zipcode: this.state.zipCodeInput,
            temperature: weatherData.main.temp,
            description: weatherData.weather[0].description
        });
    }

    render() {
        return (
            <Form className="weather-form" onSubmit={this.saveToMongo}>
                <Row type="flex" justify="center" align="center" className="zipCode">
                    <Col>
                        <span>Zip Code: </span>
                        <Form.Control
                            name="zipCodeInput"
                            type="text"
                            placeholder="Enter your zip code"
                            onChange={this.onChange}
                            className="zipCodeInput"
                        />
                    </Col>
                </Row>

                <Row type="flex" justify="center" align="center">
                    <Col span={4}>
                        <ButtonGroup toggle>
                            <ToggleButton
                                key={"C"}
                                type="radio"
                                variant="secondary"
                                name="tempMetric"
                                value={"metric"}
                                checked={this.state.tempMetric === "metric"}
                                onChange={this.onChange}
                            >
                                Celsius (°C)
                            </ToggleButton>
                            <ToggleButton
                                key={"F"}
                                type="radio"
                                variant="secondary"
                                name="tempMetric"
                                value={"imperial"}
                                checked={this.state.tempMetric === "imperial"}
                                onChange={this.onChange}
                            >
                                Fahrenheit (°F)
                            </ToggleButton>
                        </ButtonGroup>
                    </Col>
                </Row>

                <Row type="flex" justify="center" align="center">
                    <Col span={4}>
                        <Button className="save-btn" variant="primary" type="submit">
                            Save
                        </Button>
                    </Col>
                </Row>
            </Form>
        );
    }
}

// Mapping state from the store to props
const mapStateToProps = (state) => {
    return {
        zipCode: state.zipCode,
        weather: state.weather,
        tempMetric: state.tempMetric,
        history: state.history
    }
};

// Actions we can dispatch and just mapping it to props
const mapDispatchToProps = () => {
    return {
        saveZipCode,
        saveWeatherData,
        saveTemperature,
        updateHistory
    }
};

// Connects mapping the state & dispatch to props to use in WeatherForm
export default connect(mapStateToProps, mapDispatchToProps())(WeatherForm);