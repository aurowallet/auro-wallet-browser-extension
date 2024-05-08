
export const JSonToCSV = {
  /*
   * obj是一个对象，其中包含有：
   * ## data 是导出的具体数据
   * ## fileName 是导出时保存的文件名称 是string格式
   * ## showLabel 表示是否显示表头 默认显示 是布尔格式
   * ## columns 是表头对象，且title和key必须一一对应，包含有
        title:[], // 表头展示的文字
        key:[], // 获取数据的Key
        formatter: function() // 自定义设置当前数据的 传入(key, value)
   */
  setDataConvert: function(obj) {
    let data = obj['data']
    let ShowLabel = typeof obj['showLabel'] === 'undefined' ? true : obj['showLabel']
    let fileName = (obj['fileName'] || 'UserExport') + '.csv'
    let columns = obj['columns'] || {
      title: [],
      key: [],
      formatter: undefined
    }
    let row = "", CSV = '', key
    if (ShowLabel) {
      if (columns.title.length) {
        columns.title.map(function(n) {
          row += n + ','
        })
      } else {
        for (key in data[0]) row += key + ','
      }
      row = row.slice(0, -1)
      CSV += row + '\r\n'
    }
    data.map(function(n) {
      row = ''
      if (columns.key.length) {
        columns.key.map(function(m) {
          row += '"' + (typeof columns.formatter === 'function' ? columns.formatter(m, n[m]) || n[m] : n[m]) + '",'
        })
      } else {
        for (key in n) {
          row += '"' + (typeof columns.formatter === 'function' ? columns.formatter(key, n[key]) || n[key] : n[key]) + '",'
        }
      }
      row.slice(0, row.length - 1) 
      CSV += row + '\r\n'
    })
    if(!CSV) return
    this.SaveAs(fileName, CSV)
  },
  SaveAs: function(fileName, csvData) {
    let alink = document.createElement("a")
    let downloadUrl = this.getDownloadUrl(csvData)
    alink.id =  "linkDownloadLink"
    alink.href = downloadUrl
    document.body.appendChild(alink)
    let linkDom = document.getElementById('linkDownloadLink')
    linkDom.setAttribute('download', fileName)
    linkDom.click()
    document.body.removeChild(linkDom)
  },
  getDownloadUrl: function(csvData) {
    let _utf = "\uFEFF" // 为了使Excel以utf-8的编码模式，同时也是解决中文乱码的问题
    if (window.Blob && window.URL && window.URL.createObjectURL) {
      let csvBlob = new Blob([_utf + csvData], {
        type: 'text/csv'
      })
      return URL.createObjectURL(csvBlob)
    }
  }
}
