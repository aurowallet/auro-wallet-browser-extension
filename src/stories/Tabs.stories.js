import { select, text } from '@storybook/addon-knobs';
import { useState } from 'react';
import home_active from "../assets/images/home_active.png";
import home_common from "../assets/images/home_common.png";
import setting_active from "../assets/images/setting_active.png";
import setting_common from "../assets/images/setting_common.png";
import staking_active from "../assets/images/staking_active.png";
import staking_common from "../assets/images/staking_common.png";
import Tabs from '../popup/component/Tabs';



export default {
  component: Tabs,
  title: 'Tabs',
  excludeStories: /.*Data$/,
  parameters: {
    docs: { description: { component: 'some component _markdown_' } }
  }
}


export const Default = () => {
  const towardsOptions = [0, 1, 2]
  const active = select('activeTab', towardsOptions, 0)

  const [activeIndex, onChangeActiveIndex] = useState(active)

  return (
    <Tabs currentActiveIndex={activeIndex} onChangeIndex={onChangeActiveIndex}>
      <div lable={text("title1", 'wallet')}
        activeSource={home_active}
        commonSource={home_common}
      >
        <div>Wallet</div>
      </div>
      <div lable={text("title2", 'staking')}
        activeSource={staking_active}
        commonSource={staking_common}
      >
        <div>Staking</div>
      </div>
      <div
        lable={text("title3", 'setting')}
        activeSource={setting_active}
        commonSource={setting_common}
      >
        <div>Setting</div>
      </div>
    </Tabs>
  )
}
