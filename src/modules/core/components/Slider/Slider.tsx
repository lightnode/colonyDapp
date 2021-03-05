import React, { useState, useEffect } from 'react';
import ReactSlider from 'rc-slider';
import 'rc-slider/assets/index.css';

type Appearance = {
  theme?: 'primary' | 'danger';
};

interface Props {
  value: number;
  max?: number;
  limit?: number;
  appearance?: Appearance;
  onChange: (val: any) => void;
}

const displayName = 'Slider';

const Slider = ({ value, max = 100, onChange, limit = null }: Props) => {
  const [sliderValue, setSliderValue] = useState<number>(value);

  const marks = {};

  if (limit) {
    if (limit >= max) return;
  
    marks[limit] = {};
  }

  const onSliderChange = (val) => {
    if ((limit && sliderValue < limit) || val < sliderValue || !limit) {
      setSliderValue(val);
      onChange(val);
    }
    if (limit && sliderValue > limit) {
      setSliderValue(limit);
      onChange(limit);
    }
  }

  return (
    <ReactSlider
      min={0}
      step={1}
      value={sliderValue}
      onChange={onSliderChange}
      marks={marks}
      max={max}
      trackStyle={{ backgroundColor: '#68D2D2', height: 1 }}
      handleStyle={{
        borderColor: '#68D2D2',
        borderWidth: 6,
        height: 15,
        width: 15,
        marginTop: -7,
        backgroundColor: 'transparent',
      }}
      dotStyle={{
        height: 5,
        width: 1,
        backgroundColor: '#76748B',
        border: 0,
        borderRadius: 0,
        top: -2,
      }}
      railStyle={{ backgroundColor: '#C2CCCC', height: 1 }}
    />
  );
};

Slider.displayName = displayName;

export default Slider;
