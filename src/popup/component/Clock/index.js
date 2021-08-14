import React, { Component } from "react";

const schemeTime = 1 * 60 * 1000

export default class Clock extends Component {
    constructor(props) {
        super(props);
    }
    componentDidMount() {
        const { schemeEvent, repeatTime } = this.props
        let time = repeatTime || schemeTime
        this.timerID = setInterval(() => {
            schemeEvent && schemeEvent()
        }, time);
    }
    componentWillUnmount() {
        clearInterval(this.timerID);
    }
    render() {
        return (<></>);
    }
}