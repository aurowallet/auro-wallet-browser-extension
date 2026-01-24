import React, { Component } from "react";

const schemeTime = 1 * 60 * 1000

interface ClockProps {
    schemeEvent?: () => void;
    repeatTime?: number;
}

export default class Clock extends Component<ClockProps> {
    private timerID: ReturnType<typeof setInterval> | null = null;

    constructor(props: ClockProps) {
        super(props);
    }
    componentDidMount() {
        const { schemeEvent, repeatTime } = this.props
        const time = repeatTime || schemeTime
        this.timerID = setInterval(() => {
            schemeEvent && schemeEvent()
        }, time);
    }
    componentWillUnmount() {
        if (this.timerID) {
            clearInterval(this.timerID);
        }
    }
    render() {
        return (<></>);
    }
}