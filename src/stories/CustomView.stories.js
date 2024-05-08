import { boolean, text } from '@storybook/addon-knobs'
import CustomView from '../popup/component/CustomView'


export default {
    component: CustomView,
    title: 'CustomView',
    excludeStories: /.*Data$/,
    parameters: {
        docs: { description: { component: 'some component _markdown_' } }
    }
}

export const Default = () => {
    return (
        <CustomView
            backRoute={boolean("noBack", false)}
            noBack={boolean("noBack", false)}
            isReceive={boolean("showBackBg", false)}
            onGoBack={() => {
                console.log("go back")
            }}
            rightComponent={() => { }}
            children={() => {
                <div>Content</div>
            }}
            title={text("title", "title")}>
        </CustomView>
    )
}
