import React from "react";
import PropTypes from 'prop-types';
import "./SearchInput.scss";
import cls from 'classnames'
import searchIcon from '../../../../assets/images/search_icon.png'
import searchActiveIcon from '../../../../assets/images/search_icon_active.png'
import {getLanguage} from "../../../../i18n";
export class SearchInput extends React.Component {
  static propTypes = {
    onChange: PropTypes.func
  }
  constructor(props) {
    super(props);
    this.state= {
      isFocus: false
    }
  }
  onFocus = (e) => {
    this.setState({
      isFocus: true
    })
  }
  onBlur = (e) => {
    this.setState({
      isFocus: false
    })
  }
  render() {
    const containerClass = cls('search-input-con', {
      'search-input-highlight': this.state.isFocus
    });
    return (<div className={containerClass}>
      <div className={'icon-con'}>
      {
        this.state.isFocus ?
          <img src={searchActiveIcon} className={'search-icon'}/> :
          <img src={searchIcon} className={'search-icon'}/>
      }
      </div>
      <input type='text'
             placeholder={getLanguage('searchPlaceholder')}
             onBlur={this.onBlur}
             onFocus={this.onFocus}
             onChange={this.props.onChange}/>
    </div>);
  }
}
