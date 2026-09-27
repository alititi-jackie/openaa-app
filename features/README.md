# Features

Feature directories contain business queries, server actions, validation, mapping, and types. `posts/` implements the shared publish and read flows for jobs, housing, marketplace, and services.

Pages in `app/` compose feature queries and components. UI lives in `components/`; shared infrastructure and server permissions live in `lib/`. Validate user inputs and permissions at the server boundary and enforce database RLS independently.
