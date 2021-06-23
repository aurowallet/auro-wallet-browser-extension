import { boolean, button, select, text } from '@storybook/addon-knobs'
import Button, { BUTTON_TYPE_CANCEL, BUTTON_TYPE_COMMON_BUTTON, BUTTON_TYPE_CONFIRM, BUTTON_TYPE_HOME_BUTTON } from '../popup/component/Button'
import Toast from '../popup/component/Toast'

export default {
  component: Button,
  title: 'Button',
  excludeStories: /.*Data$/,
  parameters: {
    docs: { description: { component: 'some component _markdown_' } }
  }
}

export const Default = () => {

  const sizeOptions = [BUTTON_TYPE_CANCEL, BUTTON_TYPE_CONFIRM, BUTTON_TYPE_HOME_BUTTON, BUTTON_TYPE_COMMON_BUTTON]
  const buttonType = select('buttonType', sizeOptions, BUTTON_TYPE_COMMON_BUTTON)


  return (
    <Button
      content={text('button-content', "createAccount")}
      onClick={button("click", () => {
        Toast.info('Default')
      })}
      disabled={boolean('disabled', false)}
      propsClass={""}
      buttonType={buttonType}
    ></Button>
  )
}
