import { convertFromHTML, ContentState, EditorState } from "draft-js";

// See: https://github.com/facebook/draft-js/issues/493
export default function insertHTMLAtCurrentPosition (editorState, htmlString) {
  const newBlockMap = convertFromHTML(htmlString);
  const contentState = editorState.getCurrentContent();
  const selectionState = editorState.getSelection();
  const key = selectionState.getAnchorKey();
  const blocksAfter = contentState
    .getBlockMap()
    .skipUntil(function(_, k) {
      return k === key;
    })
    .skip(1)
    .toArray();
  const blocksBefore = contentState
    .getBlockMap()
    .takeUntil(function(_, k) {
      return k === key;
    })
    .toArray();

  newBlockMap.contentBlocks = blocksBefore
    .concat([contentState.getBlockForKey(key)])
    .concat(newBlockMap.contentBlocks)
    .concat(blocksAfter);

  const newContentState = ContentState.createFromBlockArray(
    newBlockMap,
    newBlockMap.entityMap
  );
  const newEditorState = EditorState.createWithContent(newContentState);
  return newEditorState
}
