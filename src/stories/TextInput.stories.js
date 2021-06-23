import { boolean, text } from '@storybook/addon-knobs'
import { useState } from 'react'
import TextInput from '../popup/component/TextInput'

export default {
  component: TextInput,
  title: 'TextInput',
  excludeStories: /.*Data$/,
  parameters: {
    docs: { description: { component: 'some component _markdown_' } }
  }
}

export const Default = () => {
  const [inputValue, setInputValue] = useState("")
  const matchList = [
    {
      text: 'atLeastOneNumber',
      expression: /[0-9]+/,
      bool: false
    },
    {
      text: 'atLeastOneLowercaseLetter',
      expression: /[a-z]+/,
      bool: false
    },
    {
      text: 'atLeastOneUppercaseLetter',
      expression: /[A-Z]+/,
      bool: false
    },
    {
      text: 'passwordRequires',
      expression: /.{8,32}/,
      bool: false
    },
  ]

  return (
    <TextInput
      placeholder={text('input-holder', "Account Name")}
      value={text('input-content', inputValue)}
      onTextInput={(e) => { setInputValue(e.target.value) }}
      label={text('Title', "Title")}
      showErrorTag={boolean("errTagShow", false)}
      matchList={matchList}
      errorTip={text('errorTip', "")}
    />
  )
}
