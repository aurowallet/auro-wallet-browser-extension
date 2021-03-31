import BigNumber from 'bignumber.js';
import React, { Component } from 'react';
import { Handles, Rail, Slider, Tracks } from 'react-compound-slider';
import { Handle, SliderRail, Track } from './components';

const sliderStyle = {
  position: 'relative',
  width: '100%',
  touchAction: 'none',
};

const domain = [0, 500];
const defaultValues = [150];
const defaultDecimal = 0
export class FeeSlider extends Component {
  state = {
    values: this.props.defaultValues || defaultValues.slice(),
    update: this.props.defaultValues || defaultValues.slice(),
  };

  componentDidMount() {
    this.decimals = this.props.decimals || defaultDecimal
    this.step = new BigNumber(1).dividedBy(new BigNumber(10).pow(this.decimals)).toNumber()
  }

  onUpdate = (update) => {
    let { onSliderChange } = this.props
    let showFee = new BigNumber(update[0]).toFixed(this.decimals, 1).toString()
    onSliderChange && onSliderChange(showFee)
    this.setState({ update });
  };

  onChange = (values) => {
    this.setState({ values });
  };

  render() {
    const {
      state: { values, update },
    } = this;
    let domain = this.props.domain
    return (
      <div style={{
        height: "30px",
        width: '100%',
        display: "flex",
        alignItems: "center"
      }}>
        <Slider
          mode={1}
          step={this.step || 1}
          domain={domain}
          rootStyle={sliderStyle}
          onUpdate={this.onUpdate}
          onChange={this.onChange}
          values={values}
        >
          <Rail>
            {({ getRailProps }) => <SliderRail getRailProps={getRailProps} />}
          </Rail>
          <Handles>
            {({ handles, getHandleProps }) => (
              <div className="slider-handles">
                {handles.map((handle) => (
                  <Handle
                    key={handle.id}
                    handle={handle}
                    domain={domain}
                    getHandleProps={getHandleProps}
                  />
                ))}
              </div>
            )}
          </Handles>
          <Tracks right={false}>
            {({ tracks, getTrackProps }) => (
              <div className="slider-tracks">
                {tracks.map(({ id, source, target }) => (
                  <Track
                    key={id}
                    source={source}
                    target={target}
                    getTrackProps={getTrackProps}
                  />
                ))}
              </div>
            )}
          </Tracks>
        </Slider>
      </div>
    );
  }
}
