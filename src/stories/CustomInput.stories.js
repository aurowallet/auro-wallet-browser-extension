import { boolean, text } from '@storybook/addon-knobs'
import { useState } from 'react'
import CustomInput from '../popup/component/CustomInput'

export default {
    component: CustomInput,
    title: 'CustomInput',
    excludeStories: /.*Data$/,
    parameters: {
        docs: { description: { component: 'some component _markdown_' } }
    }
}

export const Default = () => {
    const [inputValue, setInputValue] = useState("")
    return (
        <CustomInput
            placeholder={text('input-holder', "Account Name")}
            value={text('input-content', inputValue)}
            onTextInput={(e) => { setInputValue(e.target.value) }}
            errorTipShow={boolean('errorTip', false)}
            showTip={text('input-Tip', "")}
            label={text('Title', "Title")}
            descLabel={text('descTitle', "descTitle")}
        />
    )
}
