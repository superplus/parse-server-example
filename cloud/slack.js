function Slack() {
}

Slack.prototype.send = function(message) {
  if (!message.text) {
    return;
  }
  if (!message.channel) { message.channel = '#parsetest'; }

  var command = '';

  switch ( message.channel ) {
    case '#parsetest':
    command = 'https://hooks.slack.com/services/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';
    break;

    case '#usagestats': 
    command = 'https://hooks.slack.com/services/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';
    break;
  }
  var body = {
    channel:  message.channel,
    text:     message.text,
    username: message.username
  };

  if (message.icon_url) { body.icon_url = message.icon_url; }
  if (message.icon_emoji) { body.icon_emoji = message.icon_emoji; }
  if (message.attachments) { body.attachments = message.attachments; }
  if (message.unfurl_links) { body.unfurl_links = message.unfurl_links; }
  if (message.link_names) { body.link_names = message.link_names; }
  return Parse.Cloud.httpRequest({
    method: 'POST',
    url: command,
    body: JSON.stringify(body)
  });
};

module.exports = Slack;