# THOUGHTS DOT MD
Some spare thoughts about htmx's structure

## Primary vs Secondary Attribs
htmx has a series of primary attributes that are all mutually exclusive with each other, i.e. you
can't have both `hx-put` and `hx-post` on the same element. More importantly, these are the
attributes that we assign listeners to on document load or when those new elements are brought into
the fold via an ajax request.

Then it has secondary attributes. These are attributes that modify the listened-for action in some
way i.e. include, trigger, or swap. htmx doesn't need to know about these until it comes to time to
actually do the action.

You could think about htmx as "registering" primary action and then checking for modifiers on those
actions when it comes time to execute them.
