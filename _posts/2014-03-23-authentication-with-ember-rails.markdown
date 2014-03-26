---
layout: post
title:  "Authentication with Ember-Rails "
date:   2014-03-24 18:58:00
categories: ['blog']
---
Most web applications require some form of user authentication.  If you have ever developed a Ruby on Rails (RoR) application, it is likely that you have used an authentication gem such as Devise to handle user authentication.  However, with the growing popularity of client-side MVC frameworks such as Ember.js, how do you leverage these gems in your application?  This blog post will walk through setting up an ember-rails application using Devise for authentication.  You can find the code for this tutorial [here](https://github.com/krisbarrett/ember-rails-auth-example).

### Setup Devise 
First, generate a new Rails application:
{% highlight sh %}
rails new app && cd app 
{% endhighlight %}

Next, add Devise to your Gemfile and run 'bundle install'.
{% highlight ruby %}
# Gemfile
gem 'devise'
{% endhighlight %}

Install Devise by running the following command.  Be sure to follow the setup instructions included in the command output.  Although, it doesn't exist yet, set the root route to 'posts#index'.
{% highlight sh %}
rails generate devise:install
{% endhighlight %}

Next, generate a user model which will be used by devise:
{% highlight sh %}
rails generate devise user
{% endhighlight %}

Next, generate a resource which will require user authentication.  Let's do the classic blog post example:
{% highlight sh %}
rails generate scaffold post title body:text
rake db:migrate
{% endhighlight %}

In the posts controller, require authentication for all actions except for index and show:
{% highlight ruby %}
# app/controllers/posts_controller.rb
class PostsController < ApplicationController
  before_filter :authenticate_user!, except: [:index, :show]
end
{% endhighlight %}

Add a 'Sign Out' button to application.html.erb.  
{% highlight html %}
<!-- app/views/layouts/application.html.erb -->
<% if user_signed_in? %>
  <%= button_to 'Sign Out', destroy_user_session_path, method: :delete %>
<% end %>
{% endhighlight %}

At this point, we have a normal RoR application in which only an authenticated user can create and edit blog posts.  It's important to note that with the default Devise settings, anyone can sign up and have the ability to create and edit blog posts.  However, for the purpose of demonstrating how to setup an ember-rails app with authentication, this will suffice.

Before continuing to the next section, run the app and perform the following:
 1. Visit http://localhost:3000.
 1. Click 'New Post' and notice that you are redirected to the 'Sign in' page.
 1. Click 'Sign up' and create a new user.
 1. Try creating a few posts.
 1. Make sure the 'Edit' action also requires an authenticated user.

### Setup Ember-Rails
Add the following gems to your Gemfile and run 'bundle install'.
{% highlight ruby %}
# Gemfile
gem 'ember-rails'
gem 'ember-source', '1.4.0'
gem 'ember-data-source', '1.0.0.beta.7'
{% endhighlight %}

Run the following command to install ember-rails.
{% highlight sh %}
rails generate ember:bootstrap --javascript-engine js
{% endhighlight %}

We need a new controller to render an empty application layout to load our Ember application.  Generate an assets controller with an index action.  Delete the contents of the generated view.

{% highlight sh %}
rails g controller assets index
{% endhighlight %}

Update the root route to point at the newly generated controller.
{% highlight ruby %}
# config/routes.rb
root :to => 'assets#index'
{% endhighlight %}

Add an application template. And the application template displayed on the page.
{% highlight html %}
{% raw %}
<!-- app/assets/javascripts/templates/application.handlebars -->
<h1>Ember Blog</h1>
<div>
  {{outlet}}
</div>
{% endraw %}
{% endhighlight %}

Now when you visit http://localhost:3000, you should see the following output in the javascript console.

{% highlight text %}
DEBUG: -------------------------------
DEBUG: Ember      : 1.4.0 
DEBUG: Ember Data : 1.0.0-beta.7+canary.f482da04 
DEBUG: Handlebars : 1.3.0 
DEBUG: jQuery     : 1.11.0 
DEBUG: ------------------------------- 
{% endhighlight%}

### Add Posts to Ember
First add a Ember model for posts:
{% highlight javascript %}
// app/assets/javascripts/models/post.js
App.Post = DS.Model.extend({
  title: DS.attr('string'),
  body: DS.attr('string'),
  published: DS.attr('boolean')
});
{% endhighlight %}

Add a few resources to the Ember router:
{% highlight javascript %}
// app/assets/javascripts/router.js
App.Router.map(function() {
  this.resource('posts');
  this.resource('post', {path: 'post/:post_id'});
});
{% endhighlight %}

Add a template for posts:
{% highlight html %}
{% raw %}
<!-- app/assets/javascripts/templates/posts.handlebars -->
<h2>Posts</h2>
<ul>
{{#each}}
<li>{{#link-to 'post' this}}{{title}}{{/link-to}}</li>
{{/each}}
</ul>
{{outlet}}
{% endraw %}
{% endhighlight %}

Add a template for post:
{% highlight html %}
{% raw %}
<!-- app/assets/javascripts/templates/post.handlebars -->
<h2>{{title}}</h2>
{{body}}
{{outlet}}
<p>
  {{#link-to 'posts'}}All Posts{{/link-to}}
</p>
{% endraw %}
{% endhighlight %}

Add a route for posts:
{% highlight javascript %}
// app/assets/javascripts/routes/posts_route.js
App.PostsRoute = Ember.Route.extend({
  model: function(params) {
    return this.store.find('post');
  }
});
{% endhighlight %}

Add a route for post:
{% highlight javascript %}
// app/assets/javascripts/routes/post_route.js
App.PostRoute = Ember.Route.extend({
  model: function(params) {
    return this.store.find('post', params.post_id);
  }
});
{% endhighlight %}

Add an application route which will redirect to the posts route.
{% highlight javascript %}
// app/assets/javascripts/routes/application_route.js
App.ApplicationRoute = Ember.Route.extend({
  beforeModel: function() {
    this.transitionTo('posts');
  }
});
{% endhighlight %}

### Active Model Serializers
At this point if you try visiting http://localhost:3000/#/posts, you should see the following error in the JavaScript console:
{%highlight text %}
Error while loading route: Error: No model was found for '0'
{% endhighlight %}

If we inspect the 'Network' tab in Chrome's Developer Tools, we can see that Ember is successfully getting the posts from the Rails back end, so what's the problem?  The problem is that Ember expects the JSON returned from the server to be formatted in a specific way. Fortunately for us, there is a gem called Active Model Serializers which will allow us to format our JSON in the correct way.  Add Active Model Serializers to your Gemfile and run 'bundle install'.

{% highlight ruby %}
# Gemfile
gem 'active_model_serializers'
{% endhighlight %}

Add a serializer for posts:
{% highlight ruby %}
# app/serializers/post_serializer.rb
class PostSerializer < ActiveModel::Serializer
  attributes :id, :title, :body
end
{% endhighlight %}

We also need to update the index action of our posts controller to explicitly call 'render :json'.

{% highlight ruby %}
# app/controllers/posts_controller.rb
def index
  @posts = Post.all

  respond_to do |format|
    format.html { render html: @posts }
    format.json { render json: @posts }
  end
end
{% endhighlight %}

We also need to update the create action to render json:
{% highlight ruby %}
# app/controllers/posts_controller.rb
def create
  @post = Post.new(post_params)

  respond_to do |format|
    if @post.save
      format.html { redirect_to @post, notice: 'Post was successfully created.' }
      format.json { render json: @post }
    else
      format.html { render action: 'new' }
      format.json { render json: @post.errors, status: :unprocessable_entity }
    end
  end
end
{% endhighlight %}


### Create and Update Posts
Update the Ember router:
{% highlight javascript %}
// app/assets/javascripts/router.js
App.Router.map(function() {
  this.resource('posts', function() {
    this.route('new');
  });
  this.resource('post', {path: 'post/:post_id'}, function() {
    this.route('edit');
  });
});
{% endhighlight %}

Add templates for new and edit:
{% highlight html %}
{% raw %}
<!-- app/assets/javascripts/templates/posts/new.handlebars -->
<h2>New Post</h2>
<form>
  <p>Title:<br/> {{input value=title}}</p>
  <p>Body:<br/> {{input value=body}}</p>
  <p><button {{action "createPost"}}>Create</button></p>
</form>
{% endraw %}
{% endhighlight %}

{% highlight html %}
{% raw %}
<!-- app/assets/javascripts/templates/post/edit.handlebars -->
<h2>Edit Post</h2>
<form>
  <p>Title:<br/> {{input valueBinding='title'}}</p>
  <p>Body:<br/>  {{input valueBinding='body'}}</p>
  <p><button {{action "updatePost"}}>Update</button></p>
</form>
{% endraw %}
{% endhighlight %}

Update the posts and post templates with links to the new templates:
{% highlight html %}
{% raw %}
<!-- app/assets/javascripts/templates/posts.handlebars -->
<p>{{#link-to 'posts.new' }}New Post{{/link-to}}</p>
{% endraw %}
{% endhighlight %}

{% highlight html %}
{% raw %}
<!-- app/assets/javascripts/templates/post.handlebars -->
<p>{{#link-to 'post.edit' }}Edit Post{{/link-to}}</p>
{% endraw %}
{% endhighlight %}

Add a PostNewController and a PostEditController which will handle creating and editing posts:
{% highlight javascript %}
// app/assets/javascripts/controllers/posts_new_controller.js
App.PostsNewController = Ember.Controller.extend({
  actions: {
    createPost: function() {
      var post = this.store.createRecord('post', {
        title: this.get('title'),
        body: this.get('body')
      });
      var self = this;
      post.save().then(function() {
        console.log('post created!');
        self.transitionTo('post', post);
        self.set('title', '');
        self.set('body', '');
      }, function() {
        alert('failed to create post!');
      });
    }
  }
});
{% endhighlight %}

{% highlight javascript %}
// app/assets/javascripts/controllers/post_edit_controller.js
App.PostEditController = Ember.ObjectController.extend({
  actions: {
    updatePost: function() {
      var post = this.get('content');
      post.set('title', this.get('title'));
      post.set('body', this.get('body'));
      var controller = this;
      post.save().then(function() {
        console.log('post saved!');
        controller.transitionTo('post');
      }, function() {
        alert('failed to save post!');
      });
    }
  }
});
{% endhighlight %}

We also need a route for post edit so the model data will show up in the form.
{% highlight javascript %}
// app/assets/javascripts/routes/post_edit_route.js
App.PostEditRoute = Ember.Route.extend({
  model: function() {
    return this.modelFor('post');
  }
});
{% endhighlight %}

Make sure you are signed out by clicking the sign out button at the top of the page.  Try creating and editing some posts.  As expected, the Rails back end rejects the requests from Ember and returns a 401 unauthorized status code.  Now we need a way to sign in with Ember.

### Add User Sign In
Add routes for sign in sign out.
{% highlight javascript %}
// app/assets/javascripts/router.js
App.Router.map(function() {
  this.resource('posts', function() {
    this.route('new');
  });
  this.resource('post', {path: 'post/:post_id'}, function() {
    this.route('edit');
  });
  this.route('sign_in');
  this.route('sign_out');
});
{% endhighlight %}

Add a sign in template:
{% highlight html %}
{% raw %}
<!-- app/assets/javascripts/templates/sign_in.handlebars -->
<h2>Sign In</h2>
<form>
<p>Email: <br/>{{input value=email}}</p>
<p>Password: <br/>{{input type='password' value=password}}</p>
<p><button {{action "signIn"}}>Sign In</button></p>
</form>
{{#link-to 'posts'}}All Posts{{/link-to}}
{% endraw %}
{% endhighlight %}

Add a sign in controller:
{% highlight javascript %}
// app/assets/javascripts/controllers/sign_in_controller.js
App.SignInController = Ember.Controller.extend({
  actions : {
    signIn: function() {
      var controller = this;
      return Ember.$.post('/users/sign_in.json',
        {
          user:
          {
            email: this.get('email'),
            password: this.get('password')
          }
        },
        function(data) {
          location.reload();
        },
        'json'
      ).fail(function() {
        alert("sign in failed!");
      }
      );
    }
  }
});
{% endhighlight %}

Add a sign in link to the application template.
{% highlight html %}
{% raw %}
<!-- app/assets/javascripts/templates/application.handlebars -->
{{#link-to 'sign_in' }}Sign In{{/link-to}}
{% endraw %}
{% endhighlight %}

### Sessions Controller

At this point if we try signing in, we will get a 406 not acceptable from the Rails back end.  This is because Devise doesn't respond to JSON requests by default. To get this working, we need to override the Devise sessions controller.

{% highlight ruby %}
# app/controllers/json_sessions_controller.rb
class JsonSessionsController < Devise::SessionsController
  def create
    respond_to do |format|
      format.html { super }
      format.json {
        warden.authenticate!(:scope => resource_name, :recall => "#{controller_path}#new")
        render :status => 200, :json => { :error => "Success" }
      }
    end
  end

  def destroy
    super
  end
end
{% endhighlight %}

We tell Devise to use our custom sessions controller by updating the Rails router.

{% highlight ruby %}
# config/routes.rb
devise_for :users, :controllers => { :sessions => "json_sessions" }
{% endhighlight %}

### Cross-Site Request Forgery

Now we can sign in, but if we try to create or edit posts, the Rails back end will return a 422 unprocessabile entity status code.  This is because we are not sending the cross-site request forgery token.  Add the following function to store.js:

{% highlight javascript %}
// app/assets/javascripts/store.js
$(function() {
    var token = $('meta[name="csrf-token"]').attr('content');
    return $.ajaxPrefilter(function(options, originalOptions, xhr) {
        return xhr.setRequestHeader('X-CSRF-Token', token);
    });
});
{% endhighlight %}

#### Why refresh the page?
If you look closely at the SignInController, you will see that we are refreshing the page on sign in using 'location.reload()'.  We are doing this because when the user signs in, the session is reset and the cross-site request forgery token is regenerated.  Refreshing the page allows us to get the new token. Although this is not ideal, it's the easiest way of solving this problem short of disabling forgery protection. If you find a better way of doing this, please let me know in the comments.

### Add User Sign Out
At this point, we can sign in, create posts, and edit posts.  The only thing that is missing is the ability to sign out.  First, we need to create an application controller with a property called signedIn.

{% highlight javascript %}
// app/assets/javascripts/controllers/application_controller.js
App.ApplicationController = Ember.Controller.extend({
  signedIn: false
});
{% endhighlight %}

Because we are refreshing the page on sign in, we cannot toggle this property on sign in.  We need to include the logic in the application route before the application template is rendered.  By sending an empty post request to /users/sign_in we can tell if we are signed in based on the response from the Rails back end and set the property appropriately.

{% highlight javascript %}
// app/assets/javascripts/routes/application_route.js
App.ApplicationRoute = Ember.Route.extend({
  beforeModel: function() {
    this.transitionTo('posts');
    var route = this;
    Ember.$.post('/users/sign_in', function() {
      route.controllerFor('application').set('signedIn', true);
    }).fail(function() {
      route.controllerFor('application').set('SignedIn', false);
    });
  }
});
{% endhighlight %}

Now we can use this new property in our application template to display the 'Sign In' link if the user is not signed in or the 'Sign Out' link if the user is signed in.

{% highlight html %}
{% raw %}
<!-- app/assets/javascripts/templates/application.handlebars -->
{{#if signedIn}}
  {{#link-to 'sign_out'}}Sign Out{{/link-to}}
{{else}}
  {{#link-to 'sign_in'}}Sign In{{/link-to}}
{{/if}}
{% endraw %}
{% endhighlight %}

Next we need to add the functionality that will actually sign out the user.  This will destroy the user session on the Rails back end and refresh the page so we can get the new cross-site request forgery token.
{% highlight javascript %}
// app/assets/javascripts/routes/sign_out_route.js
App.SignOutRoute = Ember.Route.extend({
  beforeModel: function() {
    Ember.$.ajax({
      url: '/users/sign_out',
      type: 'DELETE',
      success: function(result) {
        location.reload();
      }
    });
  }
});
{% endhighlight %}

Now that sign out is working, we can remove the 'Sign Out' button from the Rails application layout.

### Conclusion
This blog post has demonstrated how to add authentication to an Ember-Rails application with Devise.  The next step would be clean up our controllers so they don't render unnecessary HTML. Another improvement would be the ability to sign in without refreshing the page.