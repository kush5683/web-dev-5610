// Typewriter animation for the homepage hero introduction.
// Streams text and links one character at a time, with a skip affordance.
const target = document.querySelector('[data-typewriter]');

if (target) {
  const segments = [
    { type: 'text', content: '> Currently working as a cloud security engineer at ' },
    { type: 'link', content: 'Inland Empire Health Plan', href: 'https://www.iehp.org/' },
    { type: 'text', content: ". I am also pursuing a Master's in Cybersecurity from " },
    { type: 'link', content: 'Northeastern University', href: 'https://www.northeastern.edu/' },
    { type: 'text', content: ". I recently completed my bachelor's in Computer Science at " },
    { type: 'link', content: 'Worcester Polytechnic Institute', href: 'https://www.wpi.edu/' },
    {
      type: 'text',
      content:
        '. My interests include web development, data science, and cybersecurity. Please check out my ',
    },
    { type: 'link', content: 'GitHub', href: 'https://github.com/kush5683' },
    { type: 'text', content: " to see what I've worked on and feel free to message me on " },
    { type: 'link', content: 'LinkedIn', href: 'https://www.linkedin.com/in/kush5683' },
    { type: 'text', content: '.' },
  ];

  // Create nodes for text segments and links as we animate.
  const createNodeForSegment = (segment) => {
    if (segment.type === 'link') {
      const link = document.createElement('a');
      link.href = segment.href;
      link.target = '_blank';
      link.rel = 'noopener';
      const textNode = document.createTextNode('');
      link.appendChild(textNode);
      return { element: link, textNode };
    }
    const textNode = document.createTextNode('');
    return { element: textNode, textNode };
  };

  let segmentIndex = 0;
  let characterIndex = 0;
  let current = null;
  let isSkipping = false;

  const appendSegmentIfNeeded = () => {
    if (!current) {
      const segment = segments[segmentIndex];
      current = createNodeForSegment(segment);
      target.appendChild(current.element);
    }
  };

  const typeNextCharacter = () => {
    if (isSkipping || segmentIndex >= segments.length) {
      return;
    }

    appendSegmentIfNeeded();
    const segment = segments[segmentIndex];
    const nextChar = segment.content.charAt(characterIndex);
    current.textNode.textContent += nextChar;
    characterIndex += 1;

    if (characterIndex >= segment.content.length) {
      segmentIndex += 1;
      characterIndex = 0;
      current = null;
    }

    const delay = 15 + Math.random() * 50; // Randomize delay for natural effect.
    setTimeout(typeNextCharacter, delay);
  };

  const finishImmediately = () => {
    if (isSkipping) {
      return;
    }
    isSkipping = true;
    target.textContent = '';
    segments.forEach((segment) => {
      if (segment.type === 'link') {
        const link = document.createElement('a');
        link.href = segment.href;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = segment.content;
        target.appendChild(link);
      } else {
        target.appendChild(document.createTextNode(segment.content));
      }
    });
  };

  // Pointer + keyboard shortcuts to skip the animation.
  target.addEventListener('click', finishImmediately);
  target.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      finishImmediately();
    }
  });


  setTimeout(typeNextCharacter, 0);
}
