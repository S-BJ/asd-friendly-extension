# Implementation References v1

This document centralizes the references used by the ASD-Friendly UI foundation docs and implementation.

## Current Implemented Scope

Runtime source:

- `src/background/index.js`
- `src/background/ai-client.js`
- `src/background/site-overrides.js`
- `src/content/index.js`
- `src/content/styles.css`
- `src/popup/index.html`
- `src/popup/index.js`
- `src/shared/settings.js`
- `src/shared/sensitive-page.js`
- `src/shared/feature-policy.js`

Implemented user-facing controls:

- English/Korean popup language selection
- first-run comfort setup
- comfort presets
- readable font normalization
- current-site `Keep fonts` exception
- theme application to page content containers
- reduced screen contrast
- current-site `Keep contrast` exception
- page density control
- text size and line spacing controls
- toggleable ad network blocking and recoverable likely-ad/distraction collapsing
- current-site `Allow ads` exception
- reduced motion
- autoplay muting
- reader mode setting
- community assist setting
- reading ruler
- active state indicator
- optional image softening with hover/focus reveal
- current-site `No image softening` exception
- optional AI helper with manual selected-text, page, and form explanation actions

## Design Policy

Features are implemented as reversible settings.

High-variance or site-fragile interventions are never hidden mandatory behavior:

- reduced contrast can be turned off globally and per site
- readable font can be turned off globally and per site
- ad blocking and likely-ad/distraction collapsing can be turned off globally, with current-site exceptions
- community assist can be turned off globally and per site
- image softening remains default off and can be turned off per site
- AI helper remains default off and user-triggered

The extension does not use AI to hide, reorder, submit, click, or restructure DOM.

## Reference Mapping

| Implementation | Current behavior | Evidence posture | References |
|---|---|---|---|
| Conservative defaults | `minimal-safe` is the default preset. Only reduced motion, autoplay muting, and active state indication are enabled by default. Higher-variance supports are opt-in. | Sensory preferences vary widely; defaults should avoid surprising visual or structural page changes. | AASPIRE; National Autistic Society sensory processing guidance; W3C COGA personalization and interruption-control guidance. |
| English/Korean popup language | User can choose `Auto`, `English`, or `Korean`; stored in sync settings. | Usability and user control, not clinical intervention. | AASPIRE guideline emphasis on clear labels and predictable interface behavior. |
| Readable font | Applies a readable sans-serif stack to content text while preserving code fonts. | Supported as a readability aid; individual preference varies. | KODDI UD OnGothic; AASPIRE; Braille Institute Atkinson Hyperlegible. |
| Korean font priority | Uses local KoddiUD OnGothic names first when installed, then Korean system fonts. | Institutional accessibility font reference, not bundled. | KODDI UD Font. |
| Text scale and line height | User-adjustable text size and spacing. | Reading themes and spacing can improve comfort; optimal values vary. | THERIF; dyslexia readability literature; W3C COGA readable content guidance. |
| Page density | Adds compact, normal, and spacious spacing modes. Sensitive pages force normal density to avoid layout disruption. | White space can improve orientation and reading comfort, but too much spacing can increase scrolling and clutter perception. | W3C COGA white spacing guidance; AASPIRE notes on clutter, scrolling, and font size tradeoffs. |
| Theme presets | Soft light, soft dark, neutral-low-contrast options. | Strong support for offering options; exact palette preference varies. | AASPIRE; readability theme research. |
| Reduced contrast | Optional, preset-enabled, reversible. | Useful for sensory sensitivity for some users, harmful for others if text contrast becomes insufficient. Must stay optional. | AASPIRE recommends low-contrast neutral palette option for sensitive vision; WCAG still requires sufficient text contrast. |
| Reduced motion | Stops or minimizes animation and transition effects. | Strong support for autistic users affected by irrelevant animation. | Uitdenbogerd et al. animation study; AASPIRE clutter/motion guidance. |
| Autoplay muting | Pauses/mutes autoplay media when possible. | Strong sensory-interruption support. | AASPIRE guidance against sonic/visual clutter; W3C interruption-control guidance. |
| Ad and distraction reduction | `adRemovalEnabled` enables a conservative MV3 declarative network request ruleset for common ad networks, plus recoverable DOM-side collapsing through `data-asd-ad-collapsed`; no DOM deletion. | Useful but fragile; risk of false positives and site breakage. Kept behind global toggle and current-site exception, and disabled on sensitive pages where appropriate. | Animation/ad distraction study; AASPIRE clutter guidance; W3C COGA interruption control. |
| Image softening | Optional default-off support. When enabled, images, video elements, and known embedded video frames are blurred by default and revealed on hover or focus. It does not upload or classify images, video frames, or thumbnails. | Plausible sensory-control support, but high variance. Kept opt-in, reversible, and disabled on sensitive pages. | National Autistic Society sensory processing guidance; AASPIRE visual clutter and user-control guidance; W3C COGA personalization guidance. |
| Sensitive page protection | Login, payment, account, health, legal, identity, and upload contexts disable site-fragile transforms such as theme recoloring, font normalization, contrast reduction, reader/community assists, distraction collapsing, and image softening. | High-risk tasks should preserve original page semantics and controls. Conservative support is safer than aggressive simplification. | W3C COGA clear controls and interruption guidance; AASPIRE predictable behavior; WCAG contrast and control requirements. |
| Community assist | Applies conservative readability support to dense community pages; does not reorder posts/comments. | Useful for dense pages but must preserve meaning and chronology. | AASPIRE predictable behavior and clutter guidance. |
| Active state indicator | Quietly shows extension active/profile state. | Reduces surprise; not a clinical intervention. | Predictability and clear labeling principles from AASPIRE. |
| AI page guide structure | AI page guide responses include page purpose, important areas, visible main actions, likely next step, optional areas, warnings, unknowns, and confidence note. | Helpful as cognitive scaffolding, but should separate visible evidence from interpretation and avoid overconfident guesses. | W3C COGA clear purpose/control guidance; UK Home Office descriptive controls guidance; LLM/autistic-users risk research. |

## Font Notes

The current font stack is:

```css
"KoddiUD OnGothic",
"KoddiUDOnGothic",
"Atkinson Hyperlegible",
"Segoe UI",
"Malgun Gothic",
"Apple SD Gothic Neo",
Verdana,
Arial,
sans-serif
```

Rationale:

- KODDI describes KoddiUD OnGothic as a universal-design Korean typeface intended for easier reading by older adults and low-vision users.
- KODDI reports usability evaluation with 332 participants, including 30 people with visual impairments.
- Atkinson Hyperlegible is included as an English/Latin fallback designed for low-vision legibility.
- System Korean fonts remain as fallback so the extension does not depend on remote font loading.

Do not bundle a font file unless the license and redistribution terms are checked again at implementation time.

## References

1. Raymaker, D. M., Kapp, S. K., McDonald, K. E., Weiner, M., Ashkenazy, E., & Nicolaidis, C. (2019). Development of the AASPIRE Web Accessibility Guidelines for Autistic Web Users. Autism in Adulthood, 1(2), 146-157. DOI: 10.1089/aut.2018.0020.  
   https://pubmed.ncbi.nlm.nih.gov/32292887/

2. Uitdenbogerd, A. L., Spichkova, M., & Alzahrani, M. (2022). Web-based Search: How Do Animated User Interface Elements Affect Autistic and Non-Autistic Users? ENASE 2022 / arXiv.  
   https://arxiv.org/abs/2211.11993

3. Cai, T., Niklaus, A. G., Kraley, M., Kerr, B., & Bylinskii, Z. (2023). THERIF: A Pipeline for Generating Themes for Readability with Iterative Feedback. arXiv.  
   https://arxiv.org/abs/2303.04221

4. Perea, M., Panadero, V., Moret-Tatay, C., & Gomez, P. (2012). The effects of inter-letter spacing in visual-word recognition. Acta Psychologica, 139(1), 184-191.  
   https://doi.org/10.1016/j.actpsy.2011.10.003

5. KODDI, Universal Design Week, UD Font / KoddiUD OnGothic.  
   https://www.koddi.or.kr/ud/sub1_2

6. Braille Institute, Atkinson Hyperlegible font family.  
   https://www.brailleinstitute.org/freefont/

7. W3C, Web Content Accessibility Guidelines contrast requirements.  
   https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html

8. UK Home Office, Accessibility Posters: Designing for Users on the Autistic Spectrum.  
   https://ukhomeoffice.github.io/accessibility-posters/autism

9. W3C, Making Content Usable for People with Cognitive and Learning Disabilities, Design Guide.  
   https://www.w3.org/TR/2021/NOTE-coga-usable-20210429/design_guide.html

10. W3C, Cognitive Accessibility Design Pattern: Limit Interruptions.  
   https://www.w3.org/WAI/WCAG2/supplemental/patterns/o5p01-minimal-interruptions/

11. National Autistic Society, Autism and Sensory Processing.  
   https://www.autism.org.uk/advice-and-guidance/about-autism/sensory-processing

12. Arya, A., et al. (2026). "I Use ChatGPT to Humanize My Words": Affordances and Risks of ChatGPT to Autistic Users. arXiv.  
   https://arxiv.org/abs/2601.17946

13. Raymaker et al., author-copy PDF for Development of the AASPIRE Web Accessibility Guidelines for Autistic Web Users.  
   https://pure.port.ac.uk/ws/portalfiles/portal/16733604/Development_of_the_AASPIRE_Web.pdf

## Implementation Cautions

- Reduced contrast must not make critical text unreadable. Keep it user-controlled.
- Ad network blocking and DOM-side distraction collapsing must remain conservative; DOM-side collapsing must remain recoverable.
- Font normalization should avoid code, math, and icon-font breakage.
- Korean font support should prefer installed/local fonts unless explicit bundled-font licensing is confirmed.
- Image softening should stay optional, reversible, and disabled on sensitive pages.
- Community pages must preserve post/comment order and voting/reply/moderation controls.
- Sensitive pages should preserve original controls and avoid layout-changing transforms.
- AI output should not imply hidden knowledge of page state, typed values, user intent, identity, payment, health, or legal meaning.
