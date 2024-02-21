# Project Proposal
## Authors: Jacob Nguyen, Zachary Pham


# Task: Vector Similarity Search on Discord Servers
- Create meaningful data from untapped potential.

# Why are you interested in solving this problem?
Discord servers are essentially closed source and unavailible to the open web. There are archive tools out there to retrieve the content of these servers, but in the process lose the nice search functionality built into discord and is very inefficient for data retrieval. By providing a corpus of high quality data from servers, this will effectively compact and provide similarity search capabilities on untapped data sets. In addition, the search functionality searches for word/lexical matches, without semantic meaning. Sentences are lost in translation while using discord's search feature.

# The high level approach
- Fetch from discord's api
- Take meaningful sentences, determined by some critieria and embed it
- Create a corpus.
- Provide an API to communicate with the corpus

# Existing resource(s) are you planning to use
We will use FAISS [1], an open source embedder created by Facebook/Meta. Python has bindings for this library. We will use htmx [2] to show the frontend, so HTML, JS, CSS as well.

# Members
The project members are Jacob Nguyen, Zachary Pham.

## References 
[1] https://github.com/facebookresearch/faiss
[2] https://htmx.org/
