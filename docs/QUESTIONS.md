# Add questions in Neon

1. On a fresh database, run [the room migration](../src/database/migrations/0001_rooms.sql), [the question migration](../src/database/migrations/0002_questions.sql), and [the Never Have I Ever migration](../src/database/migrations/0003_never_have_i_ever.sql) in order.
2. Open **Tables → closely_questions** and insert a row for each question. Enter your own text and leave `id` to its default.

To populate another database with the conversation decks, run the [card import](../src/database/seeds/0001_conversation_cards.sql) after the migrations. It adds 50 cards to each deck and can be rerun safely. Deep, Fun, and Memory cards are eligible for Answer & Reveal. If the database has no active homepage preview, the import selects one Fun card.

The [Never Have I Ever import](../src/database/seeds/0002_never_have_i_ever.sql) adds 80 prompts and can also be rerun safely. Write each prompt as a continuation of “Never have I ever…”

| Field | What to enter |
| --- | --- |
| `kind` | `card` for conversation decks, `same` for Same Brain, `bluff` for Bluff My Love, `draw` for Draw Me Wrong, or `never` for Never Have I Ever. |
| `category` | For `card` rows, use `deep`, `fun`, `memory`, `action`, `spicy`, `naughty`, or `game`. Leave it null for prompt-based games. The `game` category appears in the Random card deck. |
| `text` | Your question or prompt. Use up to 800 characters, or up to 100 for Draw Me Wrong. |
| `enabled` | Defaults to `true`. Set it to `false` to take a question out of rotation. |
| `answer_reveal` | Set it to `true` for Deep, Fun, or Memory cards you want in Answer & Reveal. Defaults to `false`. |
| `public_preview` | Set it to `true` to let the homepage display that card. Only conversation cards outside Spicy and Naughty can be marked public. Defaults to `false`. |
| `answer_terms` | Optional PostgreSQL text array for Draw Me Wrong. A guess can match the full prompt or include every term in the array. Leave it empty for other kinds. |
| `mature` | Set it to `true` for Never Have I Ever prompts that require both players to opt into After Hours. Defaults to `false`. |

Once a card is dealt or a match starts, it keeps the selected text. Edits and disabling apply to later draws and matches. Never Have I Ever uses up to eight prompts, Same Brain uses up to five, Bluff My Love uses up to six, and Draw Me Wrong uses up to four. A smaller pool produces a shorter match. The three classic games are available with an empty table.

For the full local browser suite, use an isolated test database and add at least three enabled Fun cards marked for Answer & Reveal, plus five Same Brain prompts, six Bluff My Love prompts, and four Draw Me Wrong prompts. The standalone state tests create their own fixtures.

Run the [arcade deck import](../src/database/seeds/0003_arcade_prompts.sql) to publish 20 prompts each for Same Brain, Bluff My Love, and Draw Me Wrong. It can be rerun and preserves existing questions and edits.
