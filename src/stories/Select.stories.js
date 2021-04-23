import Select from '../popup/component/Select'

export default {
    component: Select,
    title: 'Select',
    excludeStories: /.*Data$/,
    parameters: {
        docs: { description: { component: 'some component _markdown_' } }
    }
}

export const Default = () => {
    const languageOption = [
        { key: 'en', value: 'English' },
        { key: 'zh_CN', value: '中文' },
    ]
    let defaultValue = languageOption[0]
    return (
        <Select
            options={languageOption}
            defaultValue={defaultValue.value}
            onChange={() => { }}
        />
    )
}
