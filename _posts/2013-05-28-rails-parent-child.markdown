---
layout: post
title:  "Rails Parent/Child Relationship"
date:   2013-05-28 13:19:00
categories: ['blog']
---
I recently added product categories to my website.  I wanted to create a few top-level categories with some more specific sub-categories.  I decided that a parent/child relationship would be suitable for this.  First, I had to add a foreign key to the model for parent_id.  I added a belongs_to relationship called parent and a has_many relationship called children as shown below.

{% highlight ruby %}
class ProductCategory < ActiveRecord::Base
  has_many :children, class_name: 'ProductCategory', foreign_key: 'parent_id'
  belongs_to :parent, class_name: 'ProductCategory', foreign_key: 'parent_id'
end 
{% endhighlight %}

I also added a recusrive method called get_ancestors which simplifies printing the category hierarchy.

{% highlight ruby %}
def get_ancestors(level = 0, result = [])
  result.push([level, self])
  if(!self.children.empty?)
    self.children.each do |child|
      child.get_ancestors(level+1, result)
    end
  end
  if(level == 0)
    return result
  end
end
{% endhighlight %}

Finally, I added a partial which prints the category hierarchy.

{% highlight html %}
<% @product_categories = ProductCategory.where(parent_id: nil) %>

<% @product_categories.each do |product_category| %>
  <% ancestors = product_category.get_ancestors %>
  <% ancestors.each do |a| %>
    <% indent = "&nbsp;" * 3 * a[0]%>
    <%= indent.html_safe %>
    <%= link_to a[1].name, a[1] %><br/>
  <% end %>
<% end %>
{% endhighlight %}
