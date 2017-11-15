import React, { Component } from 'react'
import {create_user_db} from './db'
import worker from './worker'
import format from 'date-fns/format'

const DTF = 'HH:mm DD/MM/YYYY'
let FIRST_LOAD = true

class ConversationList extends Component {
  constructor(props) {
    super(props)
    this.state = {convs: []}
  }

  componentDidMount () {
    this._ismounted = true
    this.update_list()
    worker.add_listener('conv_list', e => this.update_list())
    if (FIRST_LOAD) {
      worker.postMessage({method: 'update_convs'})
      FIRST_LOAD = false
    }
  }

  componentWillUnmount () {
    this._ismounted = false
    worker.remove_listener('conv_list')
  }

  async update_list () {
    // TODO this seems to get called even once the component is unmounted
    const db = await create_user_db()
    db && db.transaction('r', db.convs, async () => {
      const convs = await db.convs.orderBy('updated_ts').reverse().toArray()
      if (this._ismounted) {
        this.setState(
          {convs: convs}
        )
        this.props.updateGlobal({
          page_title: null,
          nav_title: `${convs.length} Conversations`,
        })
      }
    })
  }

  format_snippet (snippet_str) {
    const snippet = JSON.parse(snippet_str)
    return <span>
      {snippet.addr}: {snippet.body}<br/>
      <small>{snippet_str}</small>
    </span>
  }

  render () {
    // TODO need a loading icon if convs. haven't yet been loaded
    return (
      <div className="box-conv-list">
        <table className="table conv-list">
          <tbody>
            {this.state.convs.map((conv, i) => (
              <tr key={i} onClick={() => this.props.history.push(`/${conv.key}`)}>
                <td key="sub">{conv.subject}</td>
                <td key="sni">{this.format_snippet(conv.snippet)}</td>
                <td key="upd" className="text-right">{format(new Date(conv.updated_ts), DTF)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
}

export default ConversationList
